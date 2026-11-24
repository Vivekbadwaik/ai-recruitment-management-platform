import os
import uuid
import shutil
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_role, hash_password
from app.models.user import User
from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding, CandidateNote
from app.models.job import Job, Application
from app.models.interview import Interview
from app.schemas.candidate import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    CandidateNoteCreate,
    CandidateNoteResponse,
    ParsedResumeData
)
from app.schemas.matching import (
    SemanticSearchQuery,
    SemanticSearchResultItem,
    CandidateMatchResult,
    AIMatchBreakdown
)
from app.schemas.job import ApplicationResponse, ApplicationStatusUpdate
from app.services.extractor import ResumeTextExtractor
from app.services.groq_service import GroqResumeParser
from app.services.embedding_service import CandidateEmbeddingService
from app.services.matching_service import CandidateMatchingEngine
from app.services.notification_service import NotificationService
from app.services.export_service import ExportService

router = APIRouter(prefix="/api/admin", tags=["Admin Recruitment Portal"])

@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Returns dashboard counts:
    Total candidates, Total resumes, Active jobs, Total applications,
    Shortlisted candidates, Scheduled interviews, Selected candidates.
    """
    total_candidates = db.query(func.count(User.id)).filter(User.role == "candidate").scalar() or 0
    total_resumes = db.query(func.count(Resume.id)).scalar() or 0
    active_jobs = db.query(func.count(Job.id)).filter(Job.status == "active").scalar() or 0
    total_applications = db.query(func.count(Application.id)).scalar() or 0
    shortlisted = db.query(func.count(Application.id)).filter(Application.status == "shortlisted").scalar() or 0
    scheduled_interviews = db.query(func.count(Interview.id)).filter(Interview.status == "scheduled").scalar() or 0
    selected = db.query(func.count(Application.id)).filter(Application.status == "selected").scalar() or 0

    return {
        "total_candidates": total_candidates,
        "total_resumes": total_resumes,
        "active_jobs": active_jobs,
        "total_applications": total_applications,
        "shortlisted": shortlisted,
        "scheduled_interviews": scheduled_interviews,
        "selected": selected
    }

@router.post("/resumes/bulk-upload")
async def bulk_upload_resumes(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Bulk resume upload for Admin.
    Processes each resume independently:
      - Extracts text (PyMuPDF / python-docx)
      - Calls Groq LLM to generate structured JSON
      - Stores candidate information in SQLite
      - Detects duplicates using email
      - Displays Completed, Failed, and Processing status
      - Robust error handling: one failure does not interrupt others
    """
    groq_parser = GroqResumeParser()
    groq_ready = groq_parser.is_configured()

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    results = []

    for file in files:
        filename = file.filename or "resume"
        ext = os.path.splitext(filename)[1].lower()

        # Check file extension
        if ext not in [".pdf", ".docx", ".doc"]:
            results.append({
                "filename": filename,
                "status": "failed",
                "message": f"Unsupported format '{ext}'. Only PDF and DOCX are supported."
            })
            continue

        saved_filename = f"bulk_{uuid.uuid4().hex[:10]}{ext}"
        file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # File size validation
            file_size = os.path.getsize(file_path)
            if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
                os.remove(file_path)
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "message": f"Exceeds max file size of {settings.MAX_FILE_SIZE_MB}MB."
                })
                continue

            # Extract text
            raw_text, file_type = ResumeTextExtractor.extract_text(file_path)

            if not groq_ready:
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "message": "Groq API key not configured. Set GROQ_API_KEY in backend/.env to parse resumes with AI."
                })
                continue

            # Parse with Groq LLM
            parsed_data: ParsedResumeData = groq_parser.parse_resume_text(raw_text)

            # Check duplicate candidate by email
            candidate_email = parsed_data.email
            if not candidate_email:
                candidate_email = f"candidate_{uuid.uuid4().hex[:6]}@example.com"

            existing_user = db.query(User).filter(User.email == candidate_email).first()
            is_duplicate = False

            if existing_user:
                candidate_user = existing_user
                is_duplicate = True
            else:
                # Create user account for candidate
                candidate_user = User(
                    email=candidate_email,
                    full_name=parsed_data.full_name or filename.replace(ext, ""),
                    hashed_password=hash_password("TemporaryPass123!"),
                    role="candidate"
                )
                db.add(candidate_user)
                db.commit()
                db.refresh(candidate_user)

            # Create or update profile
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_user.id).first()
            if not profile:
                profile = CandidateProfile(user_id=candidate_user.id)
                db.add(profile)

            profile.phone = parsed_data.phone or profile.phone
            profile.location = parsed_data.location or profile.location
            profile.headline = parsed_data.headline or profile.headline
            profile.summary = parsed_data.summary or profile.summary
            profile.skills = parsed_data.skills or profile.skills or []
            profile.education = [e.model_dump() for e in parsed_data.education] if parsed_data.education else (profile.education or [])
            profile.experience = [e.model_dump() for e in parsed_data.experience] if parsed_data.experience else (profile.experience or [])
            profile.projects = [p.model_dump() for p in parsed_data.projects] if parsed_data.projects else (profile.projects or [])
            if parsed_data.total_experience_years is not None:
                profile.total_experience_years = parsed_data.total_experience_years
            profile.is_ai_parsed = 1

            # Save Resume record
            resume_record = Resume(
                user_id=candidate_user.id,
                filename=saved_filename,
                original_filename=filename,
                file_path=file_path,
                file_type=file_type,
                file_size=file_size,
                raw_text=raw_text,
                parsed_data=parsed_data.model_dump(),
                parsing_status="completed"
            )
            db.add(resume_record)
            db.commit()
            db.refresh(profile)

            # Generate and store embedding
            search_text = CandidateEmbeddingService.build_candidate_search_text(
                full_name=candidate_user.full_name,
                headline=profile.headline,
                summary=profile.summary,
                skills=profile.skills,
                experience=profile.experience,
                education=profile.education,
                total_experience_years=profile.total_experience_years
            )
            CandidateEmbeddingService.store_or_update_candidate_embedding(db, candidate_user.id, search_text)

            results.append({
                "filename": filename,
                "status": "completed",
                "candidate_id": profile.id,
                "candidate_user_id": candidate_user.id,
                "full_name": candidate_user.full_name,
                "email": candidate_email,
                "is_duplicate": is_duplicate,
                "skills_count": len(parsed_data.skills),
                "experience_years": parsed_data.total_experience_years
            })

        except Exception as e:
            results.append({
                "filename": filename,
                "status": "failed",
                "message": str(e)
            })

    return {"processed_count": len(files), "results": results}

@router.get("/candidates")
def list_candidates(
    search: Optional[str] = None,
    skill: Optional[str] = None,
    min_exp: Optional[float] = None,
    location: Optional[str] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """View and filter all candidates with search by skills, experience, and location."""
    query = db.query(User, CandidateProfile).join(
        CandidateProfile, User.id == CandidateProfile.user_id, isouter=True
    ).filter(User.role == "candidate")

    if search:
        s = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(s),
                func.lower(User.email).like(s),
                func.lower(CandidateProfile.headline).like(s),
                func.lower(CandidateProfile.location).like(s)
            )
        )

    if location:
        query = query.filter(func.lower(CandidateProfile.location).like(f"%{location.lower()}%"))

    if min_exp is not None:
        query = query.filter(CandidateProfile.total_experience_years >= min_exp)

    records = query.order_by(User.created_at.desc()).all()
    results = []

    for user, profile in records:
        skills = profile.skills if profile and profile.skills else []
        # Skill filter
        if skill and not any(skill.lower() in s.lower() for s in skills):
            continue

        results.append({
            "candidate_id": profile.id if profile else 0,
            "user_id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "phone": profile.phone if profile else None,
            "location": profile.location if profile else None,
            "headline": profile.headline if profile else None,
            "summary": profile.summary if profile else None,
            "skills": skills,
            "total_experience_years": profile.total_experience_years if profile else 0.0,
            "is_ai_parsed": profile.is_ai_parsed if profile else 0,
            "created_at": user.created_at
        })

    return results

@router.get("/candidates/{user_id}")
def get_candidate_detail(
    user_id: int,
    current_user: User = Depends(require_role("admin", "interviewer")),
    db: Session = Depends(get_db)
):
    """View complete candidate profile, extracted information, resumes, and notes."""
    user = db.query(User).filter(User.id == user_id, User.role == "candidate").first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    resumes = db.query(Resume).filter(Resume.user_id == user_id).order_by(Resume.uploaded_at.desc()).all()
    notes = db.query(CandidateNote).filter(CandidateNote.candidate_user_id == user_id).order_by(CandidateNote.created_at.desc()).all()
    notes_list = []
    for n in notes:
        admin = db.query(User).filter(User.id == n.admin_user_id).first()
        notes_list.append({
            "id": n.id,
            "candidate_user_id": n.candidate_user_id,
            "admin_user_id": n.admin_user_id,
            "admin_name": admin.full_name if admin else "Admin",
            "note": n.note,
            "created_at": n.created_at
        })

    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "profile": {
            "id": profile.id if profile else None,
            "phone": profile.phone if profile else None,
            "location": profile.location if profile else None,
            "headline": profile.headline if profile else None,
            "summary": profile.summary if profile else None,
            "skills": profile.skills if profile else [],
            "education": profile.education if profile else [],
            "experience": profile.experience if profile else [],
            "projects": profile.projects if profile else [],
            "total_experience_years": profile.total_experience_years if profile else 0.0,
            "is_ai_parsed": profile.is_ai_parsed if profile else 0
        },
        "resumes": [
            {
                "id": r.id,
                "original_filename": r.original_filename,
                "file_type": r.file_type,
                "file_size": r.file_size,
                "parsing_status": r.parsing_status,
                "uploaded_at": r.uploaded_at
            } for r in resumes
        ],
        "notes": notes_list
    }

@router.put("/candidates/{user_id}/profile")
def admin_update_candidate_profile(
    user_id: int,
    data: CandidateProfileUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin edits candidate extracted information."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        profile = CandidateProfile(user_id=user_id)
        db.add(profile)

    if data.full_name: user.full_name = data.full_name
    if data.email: user.email = data.email
    if data.phone is not None: profile.phone = data.phone
    if data.location is not None: profile.location = data.location
    if data.headline is not None: profile.headline = data.headline
    if data.summary is not None: profile.summary = data.summary
    if data.skills is not None: profile.skills = data.skills
    if data.education is not None: profile.education = [e.model_dump() for e in data.education]
    if data.experience is not None: profile.experience = [e.model_dump() for e in data.experience]
    if data.projects is not None: profile.projects = [p.model_dump() for p in data.projects]
    if data.total_experience_years is not None: profile.total_experience_years = data.total_experience_years

    db.commit()
    db.refresh(profile)
    return {"message": "Candidate profile updated successfully."}

@router.post("/candidates/{user_id}/notes", response_model=CandidateNoteResponse)
def add_candidate_note(
    user_id: int,
    note_in: CandidateNoteCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Add internal recruiter notes to candidate."""
    note = CandidateNote(
        candidate_user_id=user_id,
        admin_user_id=current_user.id,
        note=note_in.note
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    res = CandidateNoteResponse.model_validate(note)
    res.admin_name = current_user.full_name
    return res

@router.get("/semantic-search", response_model=List[SemanticSearchResultItem])
def semantic_search_candidates_get(
    q: str = Query(..., description="Natural language search query"),
    min_score: float = Query(0.0, description="Minimum cosine similarity score (0 - 100)"),
    limit: int = Query(20, description="Max results to return"),
    skip: int = Query(0, description="Offset for pagination"),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Semantic search (GET): Converts natural language query to an embedding
    and calculates cosine similarity against all stored candidate embeddings.
    Supports min_score threshold and pagination (limit, skip).
    """
    if not q or not q.strip():
        return []

    query_emb = CandidateEmbeddingService.generate_embedding(q)
    embeddings = db.query(CandidateEmbedding).all()
    results = []

    for ce in embeddings:
        sim = CandidateEmbeddingService.cosine_similarity(query_emb, ce.embedding)
        score_pct = round(sim * 100.0, 1)

        if score_pct >= min_score:
            user = db.query(User).filter(User.id == ce.user_id).first()
            if not user:
                continue
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == ce.user_id).first()
            results.append(
                SemanticSearchResultItem(
                    candidate_id=profile.id if profile else 0,
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    headline=profile.headline if profile else None,
                    skills=profile.skills if profile and profile.skills else [],
                    total_experience_years=profile.total_experience_years if profile else 0.0,
                    location=profile.location if profile else None,
                    similarity_score=score_pct
                )
            )

    results.sort(key=lambda x: x.similarity_score, reverse=True)
    skip_val = skip if isinstance(skip, int) else 0
    limit_val = limit if isinstance(limit, int) else 20
    return results[skip_val : skip_val + limit_val]


@router.post("/semantic-search", response_model=List[SemanticSearchResultItem])
def semantic_search_candidates(
    search_body: SemanticSearchQuery,
    skip: int = 0,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Semantic search (POST): Converts natural language query to an embedding
    and calculates cosine similarity against all stored candidate embeddings.
    """
    if not search_body.query or not search_body.query.strip():
        return []

    # Generate query embedding using all-MiniLM-L6-v2
    query_emb = CandidateEmbeddingService.generate_embedding(search_body.query)

    # Fetch stored candidate embeddings
    embeddings = db.query(CandidateEmbedding).all()
    results = []

    for ce in embeddings:
        sim = CandidateEmbeddingService.cosine_similarity(query_emb, ce.embedding)
        score_pct = round(sim * 100.0, 1)

        if score_pct >= (search_body.min_score or 0.0):
            user = db.query(User).filter(User.id == ce.user_id).first()
            if not user:
                continue
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == ce.user_id).first()
            results.append(
                SemanticSearchResultItem(
                    candidate_id=profile.id if profile else 0,
                    user_id=user.id,
                    full_name=user.full_name,
                    email=user.email,
                    headline=profile.headline if profile else None,
                    skills=profile.skills if profile and profile.skills else [],
                    total_experience_years=profile.total_experience_years if profile else 0.0,
                    location=profile.location if profile else None,
                    similarity_score=score_pct
                )
            )

    results.sort(key=lambda x: x.similarity_score, reverse=True)
    skip_val = skip if isinstance(skip, int) else 0
    limit = search_body.limit or 20
    return results[skip_val : skip_val + limit]


@router.get("/jobs/{job_id}/matches", response_model=List[CandidateMatchResult])
@router.post("/jobs/{job_id}/match-candidates", response_model=List[CandidateMatchResult])
def match_candidates_for_job(
    job_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Computes hybrid AI candidate matching score (0 to 100)
    for all candidates against a specific job posting.
    Supports both GET /matches and POST /match-candidates.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    job_data = {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "min_experience": job.min_experience or 0.0,
        "max_experience": job.max_experience,
        "education_requirements": job.education_requirements
    }

    candidates = db.query(User, CandidateProfile).join(
        CandidateProfile, User.id == CandidateProfile.user_id
    ).filter(User.role == "candidate").all()

    results = []

    for user, profile in candidates:
        profile_data = {
            "skills": profile.skills or [],
            "education": profile.education or [],
            "experience": profile.experience or [],
            "total_experience_years": profile.total_experience_years or 0.0,
            "headline": profile.headline or "",
            "summary": profile.summary or ""
        }

        cand_emb_record = db.query(CandidateEmbedding).filter(CandidateEmbedding.user_id == user.id).first()
        cand_emb = cand_emb_record.embedding if cand_emb_record else None

        breakdown = CandidateMatchingEngine.calculate_match(profile_data, job_data, cand_emb)

        results.append(
            CandidateMatchResult(
                candidate_id=profile.id,
                user_id=user.id,
                full_name=user.full_name,
                email=user.email,
                headline=profile.headline,
                location=profile.location,
                breakdown=breakdown
            )
        )

    results.sort(key=lambda x: x.breakdown.overall_match_score, reverse=True)
    return results


@router.get("/candidates/{user_id}/match/{job_id}", response_model=CandidateMatchResult)
def match_single_candidate_for_job(
    user_id: int,
    job_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Detailed AI match breakdown for a specific candidate against a specific job posting.
    Returns 5-factor scores, matched/missing skills, experience/education analysis, and explanation.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    user = db.query(User).filter(User.id == user_id, User.role == "candidate").first()
    if not user:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found.")

    job_data = {
        "title": job.title,
        "description": job.description,
        "required_skills": job.required_skills or [],
        "preferred_skills": job.preferred_skills or [],
        "min_experience": job.min_experience or 0.0,
        "max_experience": job.max_experience,
        "education_requirements": job.education_requirements
    }

    profile_data = {
        "skills": profile.skills or [],
        "education": profile.education or [],
        "experience": profile.experience or [],
        "total_experience_years": profile.total_experience_years or 0.0,
        "headline": profile.headline or "",
        "summary": profile.summary or ""
    }

    cand_emb_record = db.query(CandidateEmbedding).filter(CandidateEmbedding.user_id == user.id).first()
    cand_emb = cand_emb_record.embedding if cand_emb_record else None

    breakdown = CandidateMatchingEngine.calculate_match(profile_data, job_data, cand_emb)

    return CandidateMatchResult(
        candidate_id=profile.id,
        user_id=user.id,
        full_name=user.full_name,
        email=user.email,
        headline=profile.headline,
        location=profile.location,
        breakdown=breakdown
    )


@router.put("/applications/{app_id}/override")
@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Update application status (shortlisted, interview, selected, rejected)
    with Human-in-the-Loop decision override and internal notes.
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    old_status = app.status
    app.status = status_update.status
    if status_update.admin_decision:
        app.admin_decision = status_update.admin_decision
    if status_update.admin_notes:
        app.admin_notes = status_update.admin_notes

    db.commit()
    db.refresh(app)

    job = db.query(Job).filter(Job.id == app.job_id).first()
    candidate = db.query(User).filter(User.id == app.candidate_user_id).first()

    # Notify candidate of status update
    NotificationService.send_notification(
        db=db,
        user_id=app.candidate_user_id,
        title=f"Application Update: {status_update.status.capitalize()}",
        message=f"Your application for '{job.title if job else 'Position'}' has been updated to: {status_update.status}.",
        type="info",
        link="/candidate/applications",
        recipient_email=candidate.email if candidate else None
    )

    return {"message": "Application status updated successfully.", "status": app.status}


@router.get("/interviewers")
def list_interviewers(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """List all interviewers for assignment in interview scheduling."""
    interviewers = db.query(User).filter(User.role == "interviewer").all()
    return [{"id": u.id, "full_name": u.full_name, "email": u.email} for u in interviewers]


@router.get("/applications")
def list_applications(
    status: Optional[str] = None,
    job_id: Optional[int] = None,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    List applications for Admin portal.
    Supports filtering by status (or 'shortlisted' which returns shortlisted, interview, selected) and job_id.
    """
    query = db.query(Application)
    if job_id:
        query = query.filter(Application.job_id == job_id)
    if status:
        if status == "shortlisted":
            query = query.filter(Application.status.in_(["shortlisted", "interview", "selected"]))
        else:
            query = query.filter(Application.status == status)

    apps = query.order_by(Application.applied_at.desc()).all()
    results = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        candidate = db.query(User).filter(User.id == app.candidate_user_id).first()
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_user_id).first()

        results.append({
            "id": app.id,
            "job_id": app.job_id,
            "job_title": job.title if job else "N/A",
            "candidate_user_id": app.candidate_user_id,
            "candidate_name": candidate.full_name if candidate else "N/A",
            "candidate_email": candidate.email if candidate else "N/A",
            "headline": profile.headline if profile else None,
            "location": profile.location if profile else None,
            "skills": profile.skills if profile else [],
            "total_experience_years": profile.total_experience_years if profile else 0.0,
            "status": app.status,
            "ai_match_score": app.ai_match_score,
            "ai_recommendation": app.ai_recommendation,
            "admin_decision": app.admin_decision,
            "admin_notes": app.admin_notes,
            "applied_at": app.applied_at
        })
    return results


@router.post("/jobs/{job_id}/shortlist/{candidate_user_id}")
def shortlist_candidate_for_job(
    job_id: int,
    candidate_user_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """
    Shortlist a candidate for a specific job directly from AI Matching or Candidate directory.
    If an application already exists, advances its status to 'shortlisted'.
    If not, automatically creates the application, computes the AI match score, and sets status to 'shortlisted'.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    candidate = db.query(User).filter(User.id == candidate_user_id, User.role == "candidate").first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found.")

    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == candidate_user_id).first()

    app = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_user_id == candidate_user_id
    ).first()

    if app:
        app.status = "shortlisted"
        app.admin_decision = "accepted"
        db.commit()
        db.refresh(app)
    else:
        # Calculate AI match score
        profile_data = {
            "skills": profile.skills if profile else [],
            "education": profile.education if profile else [],
            "experience": profile.experience if profile else [],
            "total_experience_years": profile.total_experience_years if profile else 0.0,
            "headline": profile.headline if profile else "",
            "summary": profile.summary if profile else ""
        }
        job_data = {
            "title": job.title,
            "description": job.description,
            "required_skills": job.required_skills or [],
            "preferred_skills": job.preferred_skills or [],
            "min_experience": job.min_experience or 0.0,
            "max_experience": job.max_experience,
            "education_requirements": job.education_requirements
        }
        cand_emb_record = db.query(CandidateEmbedding).filter(CandidateEmbedding.user_id == candidate_user_id).first()
        cand_emb = cand_emb_record.embedding if cand_emb_record else None
        breakdown = CandidateMatchingEngine.calculate_match(profile_data, job_data, cand_emb)

        app = Application(
            job_id=job_id,
            candidate_user_id=candidate_user_id,
            status="shortlisted",
            ai_match_score=breakdown.overall_match_score,
            ai_recommendation=breakdown.model_dump(),
            admin_decision="accepted"
        )
        db.add(app)
        db.commit()
        db.refresh(app)

    NotificationService.send_notification(
        db=db,
        user_id=candidate_user_id,
        title="Application Shortlisted!",
        message=f"You have been shortlisted for '{job.title}'. We will be in touch regarding the next interview round.",
        type="success",
        link="/candidate/applications",
        recipient_email=candidate.email
    )

    return {
        "message": f"{candidate.full_name} has been shortlisted for '{job.title}'.",
        "application_id": app.id,
        "status": app.status,
        "ai_match_score": app.ai_match_score
    }


@router.get("/export/shortlist")
def export_shortlist(
    job_id: Optional[int] = None,
    format: str = Query("csv", pattern="^(csv|excel)$"),
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Exports shortlisted candidates to CSV or Excel using Pandas and OpenPyXL."""
    query = db.query(Application).filter(Application.status.in_(["shortlisted", "interview", "selected"]))
    if job_id:
        query = query.filter(Application.job_id == job_id)

    applications = query.all()
    export_rows = []

    for app in applications:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        candidate = db.query(User).filter(User.id == app.candidate_user_id).first()
        profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == app.candidate_user_id).first()

        export_rows.append({
            "Application ID": app.id,
            "Job Title": job.title if job else "N/A",
            "Candidate Name": candidate.full_name if candidate else "N/A",
            "Candidate Email": candidate.email if candidate else "N/A",
            "Phone": profile.phone if profile else "N/A",
            "Location": profile.location if profile else "N/A",
            "Experience (Years)": profile.total_experience_years if profile else 0.0,
            "Skills": ", ".join(profile.skills or []) if profile else "",
            "AI Match Score (%)": app.ai_match_score or 0.0,
            "Status": app.status,
            "Admin Decision": app.admin_decision or "None",
            "Applied Date": app.applied_at.strftime("%Y-%m-%d %H:%M") if app.applied_at else ""
        })

    if not export_rows:
        export_rows = [{"Message": "No shortlisted candidates found for the specified criteria."}]

    if format == "csv":
        stream = ExportService.export_candidates_to_csv(export_rows)
        return Response(
            content=stream.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=shortlisted_candidates.csv"}
        )
    else:
        stream = ExportService.export_candidates_to_excel(export_rows)
        return Response(
            content=stream.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=shortlisted_candidates.xlsx"}
        )
