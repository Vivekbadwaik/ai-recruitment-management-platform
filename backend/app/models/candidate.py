from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    location = Column(String, nullable=True)
    headline = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # list of skills e.g. ["Python", "FastAPI"]
    education = Column(JSON, nullable=True)  # list of education items
    experience = Column(JSON, nullable=True)  # list of experience items
    projects = Column(JSON, nullable=True)  # list of projects
    total_experience_years = Column(Float, nullable=True, default=0.0)
    is_ai_parsed = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationship back to User (One-to-One)
    user = relationship("User", back_populates="profile")


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_type = Column(String, nullable=False)  # pdf, docx
    file_size = Column(Integer, nullable=True)
    raw_text = Column(Text, nullable=True)
    parsed_data = Column(JSON, nullable=True)
    parsing_status = Column(String, default="pending", nullable=False)  # pending, processing, completed, failed
    parsing_error = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)

    # Relationship back to User (Many-to-One)
    user = relationship("User", back_populates="resumes")


class CandidateEmbedding(Base):
    __tablename__ = "candidate_embeddings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    model_version = Column(String, default="all-MiniLM-L6-v2", nullable=False)
    embedding = Column(JSON, nullable=False)  # stored as list of floats
    text_used = Column(Text, nullable=True)  # the text that was embedded
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Unique constraint: one embedding record per candidate per embedding model version
    __table_args__ = (
        UniqueConstraint("user_id", "model_version", name="uq_candidate_embedding_model"),
    )

    # Relationship back to User (Many-to-One or One-to-One per model)
    user = relationship("User", back_populates="embeddings")


class CandidateNote(Base):
    __tablename__ = "candidate_notes"

    id = Column(Integer, primary_key=True, index=True)
    candidate_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    candidate = relationship("User", foreign_keys=[candidate_user_id], back_populates="candidate_notes")
    author = relationship("User", foreign_keys=[admin_user_id], back_populates="authored_notes")
