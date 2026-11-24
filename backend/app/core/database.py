import logging
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.exc import SQLAlchemyError
from app.core.config import settings

logger = logging.getLogger("recruitment_db")

# Configure SQLite engine with foreign key enforcement
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Enable SQLite foreign key constraint enforcement
if settings.DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependency to provide a transactional database session."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    Safely creates all database tables if they do not exist.
    Ensures all models are registered with Base metadata before creation.
    Avoids recreating or dropping existing data.
    """
    try:
        # Explicitly import all models to register with Base.metadata
        from app.models.user import User  # noqa: F401
        from app.models.candidate import CandidateProfile, Resume, CandidateEmbedding, CandidateNote  # noqa: F401
        from app.models.job import Job, Application  # noqa: F401
        from app.models.interview import Interview, InterviewFeedback  # noqa: F401
        from app.models.notification import Notification  # noqa: F401

        Base.metadata.create_all(bind=engine)
        logger.info("Database tables initialized successfully.")
    except SQLAlchemyError as e:
        logger.error(f"Database initialization error: {str(e)}")
        raise RuntimeError(f"Database connection or initialization failed: {str(e)}")
