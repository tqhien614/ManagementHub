import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_admin
from app.models.auth import ActivityLog, User

router = APIRouter(prefix="/admin/activity", tags=["admin"])


class LogRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    target_type: str | None
    target_id: uuid.UUID | None
    metadata_json: dict | None = None
    created_at: datetime


@router.get("", response_model=list[LogRead])
def list_activity(
    limit: int = 100,
    action: str | None = None,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> list[ActivityLog]:
    stmt = select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)
    if action:
        stmt = stmt.where(ActivityLog.action == action)
    return list(session.exec(stmt).all())


def log_activity(session: Session, user_id: uuid.UUID | None, action: str, target_type: str | None = None, target_id: uuid.UUID | None = None, metadata: dict | None = None):
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        metadata_json=metadata,
    )
    session.add(entry)
    session.commit()
