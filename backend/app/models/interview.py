from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Interview(Base):
    __tablename__ = "interviews"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    interviewer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_date = Column(DateTime, nullable=False, index=True)
    duration_minutes = Column(Integer, default=60, nullable=False)
    interview_type = Column(String, default="technical", nullable=False)  # technical, hr, behavioral, system_design
    status = Column(String, default="scheduled", nullable=False, index=True)  # scheduled, completed, cancelled, rescheduled
    meeting_link = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    application = relationship("Application", back_populates="interviews")
    candidate = relationship("User", foreign_keys=[candidate_user_id], back_populates="candidate_interviews")
    interviewer = relationship("User", foreign_keys=[interviewer_user_id], back_populates="assigned_interviews")
    job = relationship("Job", back_populates="interviews")
    feedback = relationship("InterviewFeedback", back_populates="interview", uselist=False, cascade="all, delete-orphan")


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    interviewer_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    technical_skills_rating = Column(Float, nullable=True)
    communication_rating = Column(Float, nullable=True)
    problem_solving_rating = Column(Float, nullable=True)
    overall_rating = Column(Float, nullable=True)
    remarks = Column(Text, nullable=True)
    recommendation = Column(String, nullable=True)  # strong_hire, hire, no_hire, strong_no_hire
    submitted_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    interview = relationship("Interview", back_populates="feedback")
    interviewer = relationship("User", back_populates="submitted_feedbacks")
