from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=True)  # list of required skills
    preferred_skills = Column(JSON, nullable=True)  # list of preferred skills
    min_experience = Column(Float, nullable=True, default=0.0)
    max_experience = Column(Float, nullable=True)
    education_requirements = Column(String, nullable=True)
    location = Column(String, nullable=True, default="Remote")
    employment_type = Column(String, nullable=True, default="Full-time")  # Full-time, Part-time, Contract, Internship
    application_deadline = Column(DateTime, nullable=True)
    status = Column(String, default="active", nullable=False, index=True)  # active, closed, draft
    created_by = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    creator = relationship("User", back_populates="created_jobs")
    applications = relationship(
        "Application",
        back_populates="job",
        cascade="all, delete-orphan",
        order_by="desc(Application.applied_at)"
    )
    interviews = relationship(
        "Interview",
        back_populates="job",
        cascade="all, delete-orphan"
    )


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String, default="applied", nullable=False, index=True)  # applied, reviewing, shortlisted, interview, selected, rejected
    ai_match_score = Column(Float, nullable=True)
    ai_recommendation = Column(JSON, nullable=True)  # original AI recommendation breakdown
    admin_decision = Column(String, nullable=True)  # admin override decision
    admin_notes = Column(Text, nullable=True)
    applied_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Prevent duplicate applications for the same candidate and job
    __table_args__ = (
        UniqueConstraint("job_id", "candidate_user_id", name="uq_job_candidate"),
    )

    # Relationships
    job = relationship("Job", back_populates="applications")
    candidate = relationship("User", back_populates="applications")
    interviews = relationship(
        "Interview",
        back_populates="application",
        cascade="all, delete-orphan"
    )
