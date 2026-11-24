import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import init_db
from app.routers import (
    auth_router,
    candidates_router,
    jobs_router,
    admin_router,
    interviews_router,
    notifications_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database and seed demo data on startup."""
    init_db()
    # Ensure upload directory exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield


app = FastAPI(
    title="AI Recruitment Platform",
    description="Enterprise AI-Powered Recruitment & Interview Management Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Recruitment Platform API",
        "version": "1.0.0",
        "groq_configured": bool(settings.GROQ_API_KEY),
        "smtp_configured": bool(settings.SMTP_HOST and settings.SMTP_USERNAME)
    }

# Register all Routers
app.include_router(auth_router)
app.include_router(candidates_router)
app.include_router(jobs_router)
app.include_router(admin_router)
app.include_router(interviews_router)
app.include_router(notifications_router)
