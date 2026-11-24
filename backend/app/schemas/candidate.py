from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Pydantic Schemas for AI Resume Parsing (as specified in Task 2) ---
class ParsedEducationItem(BaseModel):
    degree: Optional[str] = None
    institution: Optional[str] = None
    field: Optional[str] = None
    graduation_year: Optional[str] = None

class ParsedProjectItem(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = []

class ParsedEmploymentItem(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class ParsedResumeData(BaseModel):
    """Exact schema required for Groq LLM Resume Parsing."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    professional_summary: Optional[str] = None
    total_experience_years: Optional[float] = 0.0
    skills: List[str] = []
    education: List[ParsedEducationItem] = []
    projects: List[ParsedProjectItem] = []
    employment_history: List[ParsedEmploymentItem] = []

# --- Candidate Profile Schemas (for Database & API compatibility) ---
class CandidateProfileBase(BaseModel):
    phone: Optional[str] = None
    location: Optional[str] = None
    headline: Optional[str] = None
    summary: Optional[str] = None
    skills: Optional[List[str]] = []
    education: Optional[List[Dict[str, Any]]] = []
    experience: Optional[List[Dict[str, Any]]] = []
    projects: Optional[List[Dict[str, Any]]] = []
    total_experience_years: Optional[float] = 0.0

class CandidateProfileUpdate(CandidateProfileBase):
    full_name: Optional[str] = None
    email: Optional[str] = None

class CandidateProfileResponse(CandidateProfileBase):
    id: int
    user_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_ai_parsed: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Resume Records ---
class ResumeResponse(BaseModel):
    id: int
    user_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: Optional[int] = None
    parsing_status: str
    parsing_error: Optional[str] = None
    uploaded_at: Optional[datetime] = None
    parsed_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# --- Candidate Notes ---
class CandidateNoteCreate(BaseModel):
    note: str = Field(..., min_length=1)

class CandidateNoteResponse(BaseModel):
    id: int
    candidate_user_id: int
    admin_user_id: int
    admin_name: Optional[str] = None
    note: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
