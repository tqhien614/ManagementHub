import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_admin
from app.models.admin import SystemConfig
from app.models.auth import User

router = APIRouter(prefix="/admin/system", tags=["admin"])


class ConfigRead(BaseModel):
    key: str
    value: dict | None = None
    updated_at: str | None = None


class ConfigUpdate(BaseModel):
    value: dict


DEFAULTS = {
    "upload": {"max_size_mb": 50, "allowed_formats": [".pdf", ".docx", ".pptx", ".html", ".txt", ".md"]},
    "smtp": {"host": "", "port": 587, "user": "", "from": "no-reply@managementhub.local"},
    "general": {"site_name": "AI-PDMH", "language": "vi"},
}


@router.get("", response_model=list[ConfigRead])
def list_configs(
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> list[dict]:
    rows = session.exec(select(SystemConfig)).all()
    by_key = {r.key: r for r in rows}
    result = []
    for key in DEFAULTS:
        r = by_key.get(key)
        result.append({"key": key, "value": r.value if r else DEFAULTS[key], "updated_at": str(r.updated_at) if r else None})
    return result


@router.put("/{key}", response_model=ConfigRead)
def update_config(
    key: str,
    payload: ConfigUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> dict:
    existing = session.exec(select(SystemConfig).where(SystemConfig.key == key)).first()
    if existing:
        existing.value = payload.value
        existing.updated_by = admin.id
    else:
        existing = SystemConfig(key=key, value=payload.value, updated_by=admin.id)
    session.add(existing)
    session.commit()
    session.refresh(existing)
    return {"key": key, "value": existing.value, "updated_at": str(existing.updated_at)}


@router.get("/{key}", response_model=ConfigRead)
def get_config(
    key: str,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> dict:
    row = session.exec(select(SystemConfig).where(SystemConfig.key == key)).first()
    return {"key": key, "value": row.value if row else DEFAULTS.get(key), "updated_at": str(row.updated_at) if row else None}
