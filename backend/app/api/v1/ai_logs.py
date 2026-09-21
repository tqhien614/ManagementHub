import uuid
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_admin
from app.models.ai import AiQueryLog
from app.models.auth import User

router = APIRouter(prefix="/admin/ai-logs", tags=["admin"])


class LogRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    conversation_id: uuid.UUID | None
    prompt_tokens: int | None
    completion_tokens: int | None
    cost_usd: float | None
    latency_ms: int | None
    created_at: datetime


@router.get("", response_model=list[LogRead])
def list_logs(
    limit: int = 100,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> list[AiQueryLog]:
    return list(session.exec(
        select(AiQueryLog).order_by(AiQueryLog.created_at.desc()).limit(limit)
    ).all())
