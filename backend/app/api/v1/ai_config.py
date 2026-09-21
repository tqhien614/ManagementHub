import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_admin
from app.models.admin import AiConfig
from app.models.auth import User

router = APIRouter(prefix="/admin/ai-config", tags=["admin"])


class AiConfigRead(BaseModel):
    id: uuid.UUID
    provider: str
    model: str
    default_prompt: str | None = None
    quota_limit: int | None = None
    is_active: bool
    updated_at: datetime


class AiConfigCreate(BaseModel):
    provider: str = "anthropic"
    model: str = "claude-sonnet-5"
    api_key_encrypted: str | None = None
    default_prompt: str | None = None
    quota_limit: int | None = None
    is_active: bool = True


@router.get("", response_model=list[AiConfigRead])
def list_ai_configs(
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> list[AiConfig]:
    rows = session.exec(select(AiConfig)).all()
    if not rows:
        # Seed default from .env
        from app.core.config import settings
        default = AiConfig(
            provider="anthropic",
            model=settings.ANTHROPIC_MODEL,
            default_prompt=None,
            quota_limit=None,
            is_active=bool(settings.ANTHROPIC_AUTH_TOKEN),
        )
        session.add(default)
        session.commit()
        session.refresh(default)
        rows = [default]
    return rows


@router.post("", response_model=AiConfigRead, status_code=201)
def create_ai_config(
    payload: AiConfigCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> AiConfig:
    cfg = AiConfig(
        provider=payload.provider,
        model=payload.model,
        api_key_encrypted=payload.api_key_encrypted,
        default_prompt=payload.default_prompt,
        quota_limit=payload.quota_limit,
        is_active=payload.is_active,
    )
    session.add(cfg)
    session.commit()
    session.refresh(cfg)
    return cfg


@router.patch("/{cfg_id}", response_model=AiConfigRead)
def update_ai_config(
    cfg_id: uuid.UUID,
    payload: dict,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> AiConfig:
    cfg = session.get(AiConfig, cfg_id)
    if not cfg:
        raise HTTPException(404, "Không tìm thấy cấu hình AI")
    for k in ("provider", "model", "api_key_encrypted", "default_prompt", "quota_limit", "is_active"):
        if k in payload:
            setattr(cfg, k, payload[k])
    session.add(cfg)
    session.commit()
    session.refresh(cfg)
    return cfg
