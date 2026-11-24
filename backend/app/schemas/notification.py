from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str  # info, success, warning, error
    is_read: int
    link: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
