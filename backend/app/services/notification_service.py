import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.notification import Notification

class NotificationService:
    """Handles in-app database notifications and SMTP email delivery."""

    @staticmethod
    def is_email_configured() -> bool:
        return bool(
            settings.SMTP_HOST and
            settings.SMTP_USERNAME and
            settings.SMTP_PASSWORD and
            settings.SMTP_FROM_EMAIL
        )

    @classmethod
    def send_notification(
        cls,
        db: Session,
        user_id: int,
        title: str,
        message: str,
        type: str = "info",
        link: Optional[str] = None,
        recipient_email: Optional[str] = None
    ) -> Notification:
        """
        Always creates an in-app Notification record in database.
        Optionally sends an email via SMTP if configured.
        """
        # In-app notification
        notif = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=type,
            link=link,
            is_read=0
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        # External email (if configured and recipient email provided)
        if cls.is_email_configured() and recipient_email:
            cls._send_email(
                to_email=recipient_email,
                subject=title,
                body=f"{title}\n\n{message}\n\nAI Recruitment Platform"
            )

        return notif

    @classmethod
    def _send_email(cls, to_email: str, subject: str, body: str):
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.SMTP_FROM_EMAIL
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=5)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
        except Exception:
            # Non-blocking email failure
            pass
