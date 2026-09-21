import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.admin import Notification, NotificationType
from app.models.auth import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    type: NotificationType
    message: str
    ref_type: str | None = None
    ref_id: uuid.UUID | None = None
    is_read: bool
    created_at: datetime


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    unread_only: bool = False,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Notification]:
    stmt = select(Notification).where(Notification.user_id == user.id).order_by(Notification.created_at.desc())
    if unread_only:
        stmt = stmt.where(Notification.is_read.is_(False))
    return list(session.exec(stmt).all())


@router.post("/{notif_id}/read", response_model=NotificationRead)
def mark_read(
    notif_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Notification:
    n = session.get(Notification, notif_id)
    if not n or n.user_id != user.id:
        raise HTTPException(404, "Không tìm thấy thông báo")
    n.is_read = True
    session.add(n)
    session.commit()
    session.refresh(n)
    return n


@router.post("/read-all", status_code=200)
def mark_all_read(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    rows = session.exec(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read.is_(False))
    ).all()
    for n in rows:
        n.is_read = True
        session.add(n)
    session.commit()
    return {"marked_read": len(rows)}


@router.get("/unread-count")
def unread_count(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    count = len(session.exec(
        select(Notification).where(Notification.user_id == user.id, Notification.is_read.is_(False))
    ).all())
    return {"count": count}
