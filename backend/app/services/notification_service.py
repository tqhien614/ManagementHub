"""Helper to create notifications for a user."""
import uuid

from sqlmodel import Session

from app.models.admin import Notification, NotificationType


def notify(
    session: Session,
    user_id: uuid.UUID,
    message: str,
    type: NotificationType = NotificationType.info,
    ref_type: str | None = None,
    ref_id: uuid.UUID | None = None,
) -> Notification:
    n = Notification(
        user_id=user_id,
        type=type,
        message=message,
        ref_type=ref_type,
        ref_id=ref_id,
        is_read=False,
    )
    session.add(n)
    session.commit()
    session.refresh(n)
    return n
