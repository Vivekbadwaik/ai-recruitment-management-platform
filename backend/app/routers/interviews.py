from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.job import Job, Application
from app.models.candidate import CandidateProfile
from app.models.interview import Interview, InterviewFeedback
from app.schemas.interview import (
    InterviewCreate,
    InterviewReschedule,
    InterviewResponse,
    InterviewFeedbackCreate,
    InterviewFeedbackResponse
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/api/interviews", tags=["Interview Management"])

@router.post("", response_model=InterviewResponse, status_code=status.HTTP_201_CREATED)
def schedule_interview(
    interview_in: InterviewCreate,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin schedules an interview for a candidate."""
    app = db.query(Application).filter(Application.id == interview_in.application_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found.")

    interviewer = db.query(User).filter(User.id == interview_in.interviewer_user_id, User.role == "interviewer").first()
    if not interviewer:
        raise HTTPException(status_code=400, detail="Assigned user is not a valid interviewer.")

    job = db.query(Job).filter(Job.id == app.job_id).first()
    candidate = db.query(User).filter(User.id == app.candidate_user_id).first()

    interview = Interview(
        application_id=app.id,
        candidate_user_id=app.candidate_user_id,
        interviewer_user_id=interview_in.interviewer_user_id,
        job_id=app.job_id,
        scheduled_date=interview_in.scheduled_date,
        duration_minutes=interview_in.duration_minutes or 60,
        interview_type=interview_in.interview_type or "technical",
        meeting_link=interview_in.meeting_link,
        notes=interview_in.notes,
        status="scheduled"
    )
    db.add(interview)

    # Update application status to 'interview'
    app.status = "interview"
    db.commit()
    db.refresh(interview)

    # Send notifications to candidate and interviewer
    date_str = interview.scheduled_date.strftime("%b %d, %Y at %I:%M %p")
    NotificationService.send_notification(
        db=db,
        user_id=candidate.id,
        title="Interview Scheduled",
        message=f"Your {interview.interview_type} interview for '{job.title}' is scheduled for {date_str}.",
        type="info",
        link="/candidate/interviews",
        recipient_email=candidate.email
    )
    NotificationService.send_notification(
        db=db,
        user_id=interviewer.id,
        title="New Interview Assigned",
        message=f"You have been assigned to interview {candidate.full_name} for '{job.title}' on {date_str}.",
        type="info",
        link="/interviewer/interviews",
        recipient_email=interviewer.email
    )

    res = InterviewResponse.model_validate(interview)
    res.candidate_name = candidate.full_name
    res.candidate_email = candidate.email
    res.interviewer_name = interviewer.full_name
    res.job_title = job.title
    return res

@router.get("/all", response_model=List[InterviewResponse])
def get_all_interviews(
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin views all interviews."""
    interviews = db.query(Interview).order_by(Interview.scheduled_date.asc()).all()
    results = []
    for iv in interviews:
        candidate = db.query(User).filter(User.id == iv.candidate_user_id).first()
        interviewer = db.query(User).filter(User.id == iv.interviewer_user_id).first()
        job = db.query(Job).filter(Job.id == iv.job_id).first()
        fb_exists = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == iv.id).first() is not None

        res = InterviewResponse.model_validate(iv)
        res.candidate_name = candidate.full_name if candidate else "Candidate"
        res.candidate_email = candidate.email if candidate else "N/A"
        res.interviewer_name = interviewer.full_name if interviewer else "Interviewer"
        res.job_title = job.title if job else "Job"
        res.has_feedback = fb_exists
        results.append(res)
    return results

@router.put("/{interview_id}", response_model=InterviewResponse)
def reschedule_interview(
    interview_id: int,
    reschedule_in: InterviewReschedule,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin reschedules an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    interview.scheduled_date = reschedule_in.scheduled_date
    interview.duration_minutes = reschedule_in.duration_minutes or interview.duration_minutes
    if reschedule_in.notes:
        interview.notes = reschedule_in.notes
    interview.status = "rescheduled"

    db.commit()
    db.refresh(interview)

    candidate = db.query(User).filter(User.id == interview.candidate_user_id).first()
    interviewer = db.query(User).filter(User.id == interview.interviewer_user_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

    date_str = interview.scheduled_date.strftime("%b %d, %Y at %I:%M %p")
    NotificationService.send_notification(
        db=db,
        user_id=candidate.id,
        title="Interview Rescheduled",
        message=f"Your interview for '{job.title}' has been rescheduled to {date_str}.",
        type="warning",
        link="/candidate/interviews",
        recipient_email=candidate.email
    )
    NotificationService.send_notification(
        db=db,
        user_id=interviewer.id,
        title="Interview Rescheduled",
        message=f"Interview with {candidate.full_name} rescheduled to {date_str}.",
        type="warning",
        link="/interviewer/interviews",
        recipient_email=interviewer.email
    )

    res = InterviewResponse.model_validate(interview)
    res.candidate_name = candidate.full_name if candidate else ""
    res.candidate_email = candidate.email if candidate else ""
    res.interviewer_name = interviewer.full_name if interviewer else ""
    res.job_title = job.title if job else ""
    return res

@router.delete("/{interview_id}", status_code=status.HTTP_200_OK)
def cancel_interview(
    interview_id: int,
    current_user: User = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """Admin cancels an interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    interview.status = "cancelled"
    db.commit()

    candidate = db.query(User).filter(User.id == interview.candidate_user_id).first()
    interviewer = db.query(User).filter(User.id == interview.interviewer_user_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

    NotificationService.send_notification(
        db=db,
        user_id=candidate.id,
        title="Interview Cancelled",
        message=f"Your interview for '{job.title}' has been cancelled.",
        type="error",
        link="/candidate/interviews",
        recipient_email=candidate.email
    )

    return {"message": "Interview cancelled successfully."}

# --- Interviewer endpoints ---
@router.get("/assigned", response_model=List[InterviewResponse])
def get_assigned_interviews(
    current_user: User = Depends(require_role("interviewer")),
    db: Session = Depends(get_db)
):
    """Interviewer views their assigned interviews."""
    interviews = db.query(Interview).filter(
        Interview.interviewer_user_id == current_user.id
    ).order_by(Interview.scheduled_date.asc()).all()

    results = []
    for iv in interviews:
        candidate = db.query(User).filter(User.id == iv.candidate_user_id).first()
        job = db.query(Job).filter(Job.id == iv.job_id).first()
        fb_exists = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == iv.id).first() is not None

        res = InterviewResponse.model_validate(iv)
        res.candidate_name = candidate.full_name if candidate else "Candidate"
        res.candidate_email = candidate.email if candidate else "N/A"
        res.interviewer_name = current_user.full_name
        res.job_title = job.title if job else "Job"
        res.has_feedback = fb_exists
        results.append(res)
    return results

@router.get("/{interview_id}/candidate-profile")
def get_interview_candidate_profile(
    interview_id: int,
    current_user: User = Depends(require_role("interviewer", "admin")),
    db: Session = Depends(get_db)
):
    """Interviewer accesses authorized candidate details for their assigned interview."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if current_user.role == "interviewer" and interview.interviewer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized to view this candidate.")

    candidate = db.query(User).filter(User.id == interview.candidate_user_id).first()
    profile = db.query(CandidateProfile).filter(CandidateProfile.user_id == interview.candidate_user_id).first()
    job = db.query(Job).filter(Job.id == interview.job_id).first()

    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "email": candidate.email,
            "phone": profile.phone if profile else None,
            "location": profile.location if profile else None,
            "headline": profile.headline if profile else None,
            "summary": profile.summary if profile else None,
            "skills": profile.skills if profile else [],
            "education": profile.education if profile else [],
            "experience": profile.experience if profile else [],
            "projects": profile.projects if profile else [],
            "total_experience_years": profile.total_experience_years if profile else 0.0
        },
        "interview": {
            "id": interview.id,
            "scheduled_date": interview.scheduled_date,
            "duration_minutes": interview.duration_minutes,
            "interview_type": interview.interview_type,
            "meeting_link": interview.meeting_link,
            "notes": interview.notes,
            "job_title": job.title if job else ""
        }
    }

@router.post("/{interview_id}/feedback", response_model=InterviewFeedbackResponse, status_code=status.HTTP_201_CREATED)
def submit_interview_feedback(
    interview_id: int,
    feedback_in: InterviewFeedbackCreate,
    current_user: User = Depends(require_role("interviewer")),
    db: Session = Depends(get_db)
):
    """Interviewer submits evaluation feedback and recommendation."""
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found.")

    if interview.interviewer_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized. You are not assigned to this interview.")

    # Calculate overall rating average
    overall_avg = round(
        (feedback_in.technical_skills_rating + feedback_in.communication_rating + feedback_in.problem_solving_rating) / 3.0,
        1
    )

    feedback = InterviewFeedback(
        interview_id=interview.id,
        interviewer_user_id=current_user.id,
        technical_skills_rating=feedback_in.technical_skills_rating,
        communication_rating=feedback_in.communication_rating,
        problem_solving_rating=feedback_in.problem_solving_rating,
        overall_rating=overall_avg,
        remarks=feedback_in.remarks,
        recommendation=feedback_in.recommendation
    )
    db.add(feedback)

    # Mark interview completed
    interview.status = "completed"
    db.commit()
    db.refresh(feedback)

    # Notify admin
    job = db.query(Job).filter(Job.id == interview.job_id).first()
    candidate = db.query(User).filter(User.id == interview.candidate_user_id).first()
    NotificationService.send_notification(
        db=db,
        user_id=job.created_by if job else 1,
        title="Interview Feedback Submitted",
        message=f"{current_user.full_name} submitted feedback for {candidate.full_name} ({feedback.recommendation.replace('_', ' ').title()}).",
        type="info",
        link=f"/admin/interviews"
    )

    res = InterviewFeedbackResponse.model_validate(feedback)
    res.interviewer_name = current_user.full_name
    return res

@router.get("/{interview_id}/feedback", response_model=Optional[InterviewFeedbackResponse])
def get_interview_feedback(
    interview_id: int,
    current_user: User = Depends(require_role("admin", "interviewer")),
    db: Session = Depends(get_db)
):
    """View feedback submitted for an interview."""
    fb = db.query(InterviewFeedback).filter(InterviewFeedback.interview_id == interview_id).first()
    if not fb:
        return None
    interviewer = db.query(User).filter(User.id == fb.interviewer_user_id).first()
    res = InterviewFeedbackResponse.model_validate(fb)
    res.interviewer_name = interviewer.full_name if interviewer else "Interviewer"
    return res
