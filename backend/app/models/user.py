from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="candidate")  # candidate, admin, interviewer
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # 1. One user can have one candidate profile
    profile = relationship(
        "CandidateProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # 2. One candidate user can have multiple resumes
    resumes = relationship(
        "Resume",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(Resume.uploaded_at)"
    )

    # 3. One candidate user can have multiple applications
    applications = relationship(
        "Application",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="desc(Application.applied_at)"
    )

    # 5. One candidate user can have embedding record(s)
    embeddings = relationship(
        "CandidateEmbedding",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    # 6. One candidate user can receive multiple internal notes (as subject)
    candidate_notes = relationship(
        "CandidateNote",
        foreign_keys="CandidateNote.candidate_user_id",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="desc(CandidateNote.created_at)"
    )

    # Admin author relationship for notes written
    authored_notes = relationship(
        "CandidateNote",
        foreign_keys="CandidateNote.admin_user_id",
        back_populates="author"
    )

    # 7. One candidate user can have multiple interviews (as candidate)
    candidate_interviews = relationship(
        "Interview",
        foreign_keys="Interview.candidate_user_id",
        back_populates="candidate",
        cascade="all, delete-orphan",
        order_by="Interview.scheduled_date"
    )

    # 8. One interviewer user can be assigned multiple interviews
    assigned_interviews = relationship(
        "Interview",
        foreign_keys="Interview.interviewer_user_id",
        back_populates="interviewer",
        order_by="Interview.scheduled_date"
    )

    # Feedback submitted by interviewer
    submitted_feedbacks = relationship(
        "InterviewFeedback",
        back_populates="interviewer"
    )

    # 10. One user can receive multiple notifications
    notifications = relationship(
        "Notification",
        back_populates="user",
        cascade="all, delete-orphan",
        order_by="desc(Notification.created_at)"
    )

    # Jobs created by user (admin)
    created_jobs = relationship(
        "Job",
        back_populates="creator"
    )
