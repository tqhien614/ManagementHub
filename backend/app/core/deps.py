import uuid

from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session
from app.core.security import decode_token
from app.models.auth import User, UserStatus


def get_current_user(
    authorization: str | None = Header(default=None),
    session: Session = Depends(get_session),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Thiếu token xác thực")
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token không hợp lệ")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token không hợp lệ")
    user = session.get(User, uuid.UUID(user_id))
    if not user or user.status != UserStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản không hợp lệ hoặc chưa kích hoạt")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Yêu cầu quyền admin")
    return user
