from app.routers.auth import router as auth_router
from app.routers.candidates import router as candidates_router
from app.routers.jobs import router as jobs_router
from app.routers.admin import router as admin_router
from app.routers.interviews import router as interviews_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "auth_router",
    "candidates_router",
    "jobs_router",
    "admin_router",
    "interviews_router",
    "notifications_router",
]
