from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class SemanticSearchQuery(BaseModel):
    query: str
    min_score: Optional[float] = 0.0
    limit: Optional[int] = 20

class SemanticSearchResultItem(BaseModel):
    candidate_id: int
    user_id: int
    full_name: str
    email: str
    headline: Optional[str] = None
    skills: List[str] = []
    total_experience_years: Optional[float] = 0.0
    location: Optional[str] = None
    similarity_score: float  # Cosine similarity 0.0 to 1.0 or 0 to 100%

class AIMatchBreakdown(BaseModel):
    required_skill_score: float       # 0 - 100 (weight 40%)
    experience_score: float           # 0 - 100 (weight 20%)
    education_score: float            # 0 - 100 (weight 10%)
    preferred_skill_score: float      # 0 - 100 (weight 10%)
    semantic_similarity_score: float  # 0 - 100 (weight 20%)
    overall_match_score: float        # 0 - 100 weighted total

    matched_required_skills: List[str] = []
    missing_required_skills: List[str] = []
    matched_preferred_skills: List[str] = []
    missing_preferred_skills: List[str] = []

    candidate_experience_years: float
    required_experience_min: float
    required_experience_max: Optional[float] = None
    experience_summary: str

    candidate_education_summary: str
    job_education_requirements: Optional[str] = None
    education_summary: str

    explanation: str

class CandidateMatchResult(BaseModel):
    candidate_id: int
    user_id: int
    full_name: str
    email: str
    headline: Optional[str] = None
    location: Optional[str] = None
    breakdown: AIMatchBreakdown
