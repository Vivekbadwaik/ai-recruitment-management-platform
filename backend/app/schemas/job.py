from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    description: str = Field(..., min_length=10)
    required_skills: List[str] = []
    preferred_skills: List[str] = []
    min_experience: Optional[float] = 0.0
    max_experience: Optional[float] = None
    education_requirements: Optional[str] = None
    location: Optional[str] = "Remote"
    employment_type: Optional[str] = "Full-time"  # Full-time, Part-time, Contract, Internship
    application_deadline: Optional[datetime] = None
    status: Optional[str] = "active"  # active, closed, draft

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_experience: Optional[float] = None
    max_experience: Optional[float] = None
    education_requirements: Optional[str] = None
    location: Optional[str] = None
    employment_type: Optional[str] = None
    application_deadline: Optional[datetime] = None
    status: Optional[str] = None

class JobResponse(JobBase):
    id: int
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    applicant_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Application Schemas ---
class ApplicationCreate(BaseModel):
    job_id: int

class ApplicationStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(applied|reviewing|shortlisted|interview|selected|rejected)$")
    admin_decision: Optional[str] = None
    admin_notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: int
    job_title: Optional[str] = None
    candidate_user_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    status: str
    ai_match_score: Optional[float] = None
    ai_recommendation: Optional[Dict[str, Any]] = None
    admin_decision: Optional[str] = None
    admin_notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
