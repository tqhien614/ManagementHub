import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class UserStatus(str, Enum):
    pending = "pending"
    active = "active"
    blocked = "blocked"


class OtpPurpose(str, Enum):
    signup = "signup"
    reset = "reset"


class RoleName(str, Enum):
    admin = "admin"
    manager = "manager"
    editor = "editor"
    user = "user"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    username: str = Field(max_length=50, unique=True, index=True)
    display_name: str = Field(max_length=100)
    email: str = Field(max_length=255, unique=True, index=True)
    password_hash: str = Field(max_length=255)
    avatar_url: str | None = Field(default=None, max_length=500)
    bio: str | None = Field(default=None)
    status: UserStatus = Field(default=UserStatus.pending, index=True)
    is_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class OtpCode(SQLModel, table=True):
    __tablename__ = "otp_codes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    code_hash: str = Field(max_length=255)
    purpose: OtpPurpose = Field(default=OtpPurpose.signup)
    expires_at: datetime = Field()
    used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=now_utc)


class PasswordReset(SQLModel, table=True):
    __tablename__ = "password_resets"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    token: str = Field(max_length=64, unique=True, index=True)
    expires_at: datetime = Field()
    used_at: datetime | None = Field(default=None)
    created_at: datetime = Field(default_factory=now_utc)


class Role(SQLModel, table=True):
    __tablename__ = "roles"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: RoleName = Field(unique=True, index=True)
    description: str | None = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=now_utc)


class UserRole(SQLModel, table=True):
    __tablename__ = "user_roles"

    user_id: uuid.UUID = Field(foreign_key="users.id", primary_key=True, ondelete="CASCADE")
    role_id: uuid.UUID = Field(foreign_key="roles.id", primary_key=True, ondelete="CASCADE")


class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID | None = Field(
        default=None, foreign_key="users.id", index=True, ondelete="SET NULL"
    )
    action: str = Field(max_length=100, index=True)
    target_type: str | None = Field(default=None, max_length=50)
    target_id: uuid.UUID | None = Field(default=None)
    metadata_json: dict | None = Field(
        default=None, sa_column=Column("metadata_json", JSON)
    )
    created_at: datetime = Field(default_factory=now_utc, index=True)
