from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.job import Job, Application
from app.schemas.job import JobCreate, JobUpdate, JobResponse

router = APIRouter(prefix="/api/jobs", tags=["Job Management"])

@router.get("", response_model=List[JobResponse])
def list_jobs(
    status_filter: Optional[str] = "active",
    db: Session = Depends(get_db)
):
    """List jobs. By default returns active jobs."""
    query = db.query(Job)
    if status_filter and status_filter != "all":
        query = query.filter(Job.status == status_filter)
    
    jobs = query.order_by(Job.created_at.desc()).all()
    results = []
    for job in jobs:
        cnt = db.query(func.count(Application.id)).filter(Application.job_id == job.id).scalar()
        res = JobResponse.model_validate(job)
        res.applicant_count = cnt or 0
        results.append(res)
    return results

@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Retrieve single job details."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    cnt = db.query(func.count(Application.id)).filter(Application.job_id == job.id).scalar()
    res = JobResponse.model_validate(job)
    res.applicant_count = cnt or 0
    return res

@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(
    job_in: JobCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Create a new job posting (Admin only)."""
    job = Job(
        title=job_in.title,
        description=job_in.description,
        required_skills=job_in.required_skills,
        preferred_skills=job_in.preferred_skills,
        min_experience=job_in.min_experience,
        max_experience=job_in.max_experience,
        education_requirements=job_in.education_requirements,
        location=job_in.location,
        employment_type=job_in.employment_type,
        application_deadline=job_in.application_deadline,
        status=job_in.status or "active",
        created_by=current_user.id
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    res = JobResponse.model_validate(job)
    res.applicant_count = 0
    return res

@router.put("/{job_id}", response_model=JobResponse)
def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Update job details (Admin only)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    update_data = job_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    cnt = db.query(func.count(Application.id)).filter(Application.job_id == job.id).scalar()
    res = JobResponse.model_validate(job)
    res.applicant_count = cnt or 0
    return res

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(
    job_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Delete a job posting (Admin only)."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    # Also delete associated applications
    db.query(Application).filter(Application.job_id == job_id).delete()
    db.delete(job)
    db.commit()
    return None
