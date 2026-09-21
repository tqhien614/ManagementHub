import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import require_admin
from app.models.auth import User, UserStatus
from app.models.admin import NotificationType
from app.schemas.auth import UserRead
from app.schemas.common import ORMBase
from app.services.notification_service import notify

router = APIRouter(prefix="/admin/users", tags=["admin"])


class ApproveAction(ORMBase):
    action: str  # "activate" | "block" | "unblock"


@router.get("", response_model=list[UserRead])
def list_users(
    status_filter: str | None = None,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    if status_filter:
        stmt = stmt.where(User.status == status_filter)
    return list(session.exec(stmt).all())


@router.post("/{user_id}/approve", response_model=UserRead)
def approve_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy user")
    user.status = UserStatus.active
    session.add(user)
    session.commit()
    session.refresh(user)
    notify(session, user.id, "Tài khoản của bạn đã được admin phê duyệt. Bạn có thể đăng nhập.", NotificationType.info, "user", user.id)
    return user


@router.post("/{user_id}/block", response_model=UserRead)
def block_user(
    user_id: uuid.UUID,
    session: Session = Depends(get_session),
    admin: User = Depends(require_admin),
) -> User:
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Không tìm thấy user")
    user.status = UserStatus.blocked
    session.add(user)
    session.commit()
    session.refresh(user)
    notify(session, user.id, "Tài khoản của bạn đã bị khóa.", NotificationType.warning, "user", user.id)
    return user
