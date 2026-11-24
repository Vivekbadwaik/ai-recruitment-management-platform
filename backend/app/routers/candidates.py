import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding
from app.models.job import Job, Application
from app.models.interview import Interview
from app.schemas.candidate import (
    CandidateProfileResponse,
    CandidateProfileUpdate,
    ResumeResponse,
    ParsedResumeData
)
from app.schemas.job import ApplicationResponse
from app.schemas.interview import InterviewResponse
from app.services.extractor import ResumeTextExtractor
from app.services.groq_service import GroqResumeParser
from app.services.embedding_service import CandidateEmbeddingService
from app.services.matching_service import CandidateMatchingEngine
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/candidates", tags=["Candidate Portal"])

@router.get("/me/profile", response_model=CandidateProfileResponse)
def get_my_profile(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """Retrieve logged-in candidate's profile."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        # Create empty profile if not yet created
        profile = CandidateProfile(
            user_id=current_user.id,
            skills=[],
            education=[],
            experience=[],
            projects=[],
            total_experience_years=0.0
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    res = CandidateProfileResponse.model_validate(profile)
    res.full_name = current_user.full_name
    res.email = current_user.email
    return res

@router.put("/me/profile", response_model=CandidateProfileResponse)
def update_my_profile(
    data: CandidateProfileUpdate,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """Save reviewed/edited candidate profile information."""
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
    if not profile:
        profile = CandidateProfile(user_id=current_user.id)
        db.add(profile)

    # Update candidate profile fields
    if data.phone is not None: profile.phone = data.phone
    if data.location is not None: profile.location = data.location
    if data.headline is not None: profile.headline = data.headline
    if data.summary is not None: profile.summary = data.summary
    if data.skills is not None: profile.skills = data.skills
    if data.education is not None: profile.education = [e.model_dump() for e in data.education]
    if data.experience is not None: profile.experience = [e.model_dump() for e in data.experience]
    if data.projects is not None: profile.projects = [p.model_dump() for p in data.projects]
    if data.total_experience_years is not None: profile.total_experience_years = data.total_experience_years

    # Update User model if name or email changed
    if data.full_name:
        current_user.full_name = data.full_name
    if data.email and data.email != current_user.email:
        # Check uniqueness
        exist = db.query(User).filter(User.email == data.email, User.id != current_user.id).first()
        if exist:
            raise HTTPException(status_code=400, detail="Email is already in use.")
        current_user.email = data.email

    db.commit()
    db.refresh(profile)

    # Re-generate embedding
    search_text = CandidateEmbeddingService.build_candidate_search_text(
        full_name=current_user.full_name,
        headline=profile.headline,
        summary=profile.summary,
        skills=profile.skills,
        experience=profile.experience,
        education=profile.education,
        total_experience_years=profile.total_experience_years
    )
    CandidateEmbeddingService.store_or_update_candidate_embedding(db, current_user.id, search_text)

    res = CandidateProfileResponse.model_validate(profile)
    res.full_name = current_user.full_name
    res.email = current_user.email
    return res

@router.post("/me/resume", response_model=ResumeResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """Upload resume (PDF/DOCX), parse via Groq LLM, and update profile."""
    filename = file.filename or "resume"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in [".pdf", ".docx", ".doc"]:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Only PDF and DOCX files are allowed."
        )

    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    saved_filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, saved_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    if file_size > settings.MAX_FILE_SIZE_MB * 1024 * 1024:
        os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_MB}MB."
        )

    # Extract text
    try:
        raw_text, file_type = ResumeTextExtractor.extract_text(file_path)
    except Exception as e:
        resume_record = Resume(
            user_id=current_user.id,
            filename=saved_filename,
            original_filename=filename,
            file_path=file_path,
            file_type=ext.replace(".", ""),
            file_size=file_size,
            parsing_status="failed",
            parsing_error=str(e)
        )
        db.add(resume_record)
        db.commit()
        db.refresh(resume_record)
        raise HTTPException(status_code=400, detail=f"Failed to read resume file: {str(e)}")

    # Parse via Groq LLM
    groq_parser = GroqResumeParser()
    parsed_data_dict = None
    parsing_status = "completed"
    parsing_error = None

    if not groq_parser.is_configured():
        parsing_status = "failed"
        parsing_error = "Groq API key not configured. Set GROQ_API_KEY in backend/.env to parse resumes with AI."
    else:
        try:
            parsed_result: ParsedResumeData = groq_parser.parse_resume_text(raw_text)
            parsed_data_dict = parsed_result.model_dump()

            # Update CandidateProfile automatically with parsed data
            profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
            if not profile:
                profile = CandidateProfile(user_id=current_user.id)
                db.add(profile)

            if parsed_result.phone: profile.phone = parsed_result.phone
            if parsed_result.location: profile.location = parsed_result.location
            if parsed_result.headline: profile.headline = parsed_result.headline
            if parsed_result.summary: profile.summary = parsed_result.summary
            if parsed_result.skills: profile.skills = parsed_result.skills
            if parsed_result.education: profile.education = [e.model_dump() for e in parsed_result.education]
            if parsed_result.experience: profile.experience = [e.model_dump() for e in parsed_result.experience]
            if parsed_result.projects: profile.projects = [p.model_dump() for p in parsed_result.projects]
            if parsed_result.total_experience_years is not None:
                profile.total_experience_years = parsed_result.total_experience_years
            profile.is_ai_parsed = 1

            # Update full_name if candidate name was empty or default
            if parsed_result.full_name and current_user.full_name in ["", "Candidate", "User"]:
                current_user.full_name = parsed_result.full_name

            # Generate candidate embedding
            search_text = CandidateEmbeddingService.build_candidate_search_text(
                full_name=current_user.full_name,
                headline=profile.headline,
                summary=profile.summary,
                skills=profile.skills,
                experience=profile.experience,
                education=profile.education,
                total_experience_years=profile.total_experience_years
            )
            CandidateEmbeddingService.store_or_update_candidate_embedding(db, current_user.id, search_text)

        except Exception as parse_err:
            parsing_status = "failed"
            parsing_error = str(parse_err)

    # Save resume record
    resume_record = Resume(
        user_id=current_user.id,
        filename=saved_filename,
        original_filename=filename,
        file_path=file_path,
        file_type=file_type,
        file_size=file_size,
        raw_text=raw_text,
        parsed_data=parsed_data_dict,
        parsing_status=parsing_status,
        parsing_error=parsing_error
    )
    db.add(resume_record)
    db.commit()
    db.refresh(resume_record)

    return resume_record

@router.get("/me/resumes", response_model=List[ResumeResponse])
def get_my_resumes(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """List uploaded resumes for the candidate."""
    return db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.uploaded_at.desc()).all()

@router.post("/me/apply/{job_id}", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(
    job_id: int,
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """Apply for a job posting. Prevents duplicate applications."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job.status != "active":
        raise HTTPException(status_code=400, detail="This job posting is no longer active.")

    # Check duplicate application constraint
    existing = db.query(Application).filter(
        Application.job_id == job_id,
        Application.candidate_user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job.")

    # Calculate AI Match score based on candidate profile
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == current_user.id).first()
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

    # Retrieve candidate embedding if available
    cand_emb_record = db.query(CandidateEmbedding).filter(CandidateEmbedding.user_id == current_user.id).first()
    cand_emb = cand_emb_record.embedding if cand_emb_record else None

    breakdown = CandidateMatchingEngine.calculate_match(profile_data, job_data, cand_emb)

    application = Application(
        job_id=job_id,
        candidate_user_id=current_user.id,
        status="applied",
        ai_match_score=breakdown.overall_match_score,
        ai_recommendation=breakdown.model_dump()
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # In-app notification for candidate
    NotificationService.send_notification(
        db=db,
        user_id=current_user.id,
        title="Application Submitted",
        message=f"You successfully applied for '{job.title}'. AI Match Score: {breakdown.overall_match_score:.1f}%",
        type="success",
        link="/candidate/applications",
        recipient_email=current_user.email
    )

    # Notification for job creator / admin
    NotificationService.send_notification(
        db=db,
        user_id=job.created_by,
        title="New Candidate Application",
        message=f"{current_user.full_name} applied for '{job.title}' (AI Match: {breakdown.overall_match_score:.1f}%).",
        type="info",
        link=f"/admin/matching?job_id={job.id}"
    )

    res = ApplicationResponse.model_validate(application)
    res.job_title = job.title
    res.candidate_name = current_user.full_name
    res.candidate_email = current_user.email
    return res

@router.get("/me/applications", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """View application history and statuses."""
    apps = db.query(Application).filter(Application.candidate_user_id == current_user.id).order_by(Application.applied_at.desc()).all()
    results = []
    for app in apps:
        job = db.query(Job).filter(Job.id == app.job_id).first()
        res = ApplicationResponse.model_validate(app)
        res.job_title = job.title if job else "Unknown Job"
        res.candidate_name = current_user.full_name
        res.candidate_email = current_user.email
        results.append(res)
    return results

@router.get("/me/interviews", response_model=List[InterviewResponse])
def get_my_interviews(
    current_user: User = Depends(require_role("candidate")),
    db: Session = Depends(get_db)
):
    """View scheduled interviews for logged-in candidate."""
    interviews = db.query(Interview).filter(Interview.candidate_user_id == current_user.id).order_by(Interview.scheduled_date.asc()).all()
    results = []
    for iv in interviews:
        interviewer = db.query(User).filter(User.id == iv.interviewer_user_id).first()
        job = db.query(Job).filter(Job.id == iv.job_id).first()
        res = InterviewResponse.model_validate(iv)
        res.candidate_name = current_user.full_name
        res.candidate_email = current_user.email
        res.interviewer_name = interviewer.full_name if interviewer else "Interviewer"
        res.job_title = job.title if job else "Position"
        results.append(res)
    return results
