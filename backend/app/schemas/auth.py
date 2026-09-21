import uuid
from datetime import datetime

from app.models.auth import UserStatus
from app.schemas.common import ORMBase


class UserCreate(ORMBase):
    username: str
    display_name: str
    email: str
    password: str


class UserRead(ORMBase):
    id: uuid.UUID
    username: str
    display_name: str
    email: str
    avatar_url: str | None = None
    bio: str | None = None
    status: UserStatus
    is_admin: bool
    created_at: datetime


class UserUpdate(ORMBase):
    display_name: str | None = None
    avatar_url: str | None = None
    bio: str | None = None


class OtpVerify(ORMBase):
    email: str
    code: str
    purpose: str = "signup"


class OtpResend(ORMBase):
    email: str
    purpose: str = "signup"


class LoginRequest(ORMBase):
    username: str
    password: str


class TokenResponse(ORMBase):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


class ForgotPasswordRequest(ORMBase):
    email: str


class ResetPasswordRequest(ORMBase):
    token: str
    new_password: str


UserRead.model_rebuild()
TokenResponse.model_rebuild()
