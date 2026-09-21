import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user, require_admin
from app.models.auth import Role, RoleName, User, UserRole

router = APIRouter(prefix="/roles", tags=["roles"])


class RoleRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    user_count: int = 0


class AssignRole(BaseModel):
    user_id: uuid.UUID
    role_id: uuid.UUID


@router.get("", response_model=list[RoleRead])
def list_roles(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[dict]:
    roles = session.exec(select(Role)).all()
    result = []
    for r in roles:
        count = len(session.exec(select(UserRole).where(UserRole.role_id == r.id)).all())
        result.append({"id": r.id, "name": r.name.value, "description": r.description, "user_count": count})
    return result


@router.post("/assign", response_model=dict)
def assign_role(
    payload: AssignRole,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> dict:
    existing = session.exec(
        select(UserRole).where(UserRole.user_id == payload.user_id, UserRole.role_id == payload.role_id)
    ).first()
    if existing:
        return {"message": "Đã gán vai trò này"}
    session.add(UserRole(user_id=payload.user_id, role_id=payload.role_id))
    session.commit()
    return {"message": "Đã gán vai trò"}


@router.delete("/revoke", response_model=dict)
def revoke_role(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> dict:
    link = session.exec(
        select(UserRole).where(UserRole.user_id == user_id, UserRole.role_id == role_id)
    ).first()
    if link:
        session.delete(link)
        session.commit()
    return {"message": "Đã thu hồi vai trò"}
