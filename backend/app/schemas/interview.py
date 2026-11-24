from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class InterviewCreate(BaseModel):
    application_id: int
    interviewer_user_id: int
    scheduled_date: datetime
    duration_minutes: Optional[int] = 60
    interview_type: Optional[str] = "technical"  # technical, hr, behavioral
    meeting_link: Optional[str] = None
    notes: Optional[str] = None

class InterviewReschedule(BaseModel):
    scheduled_date: datetime
    duration_minutes: Optional[int] = 60
    notes: Optional[str] = None

class InterviewResponse(BaseModel):
    id: int
    application_id: int
    candidate_user_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    interviewer_user_id: int
    interviewer_name: Optional[str] = None
    job_id: int
    job_title: Optional[str] = None
    scheduled_date: datetime
    duration_minutes: int
    interview_type: str
    status: str
    meeting_link: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    has_feedback: Optional[bool] = False

    class Config:
        from_attributes = True

class InterviewFeedbackCreate(BaseModel):
    technical_skills_rating: float = Field(..., ge=1, le=5)
    communication_rating: float = Field(..., ge=1, le=5)
    problem_solving_rating: float = Field(..., ge=1, le=5)
    remarks: str = Field(..., min_length=5)
    recommendation: str = Field(..., pattern="^(strong_hire|hire|no_hire|strong_no_hire)$")

class InterviewFeedbackResponse(BaseModel):
    id: int
    interview_id: int
    interviewer_user_id: int
    interviewer_name: Optional[str] = None
    technical_skills_rating: Optional[float] = None
    communication_rating: Optional[float] = None
    problem_solving_rating: Optional[float] = None
    overall_rating: Optional[float] = None
    remarks: Optional[str] = None
    recommendation: Optional[str] = None
    submitted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
