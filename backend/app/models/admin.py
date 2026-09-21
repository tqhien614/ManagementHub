import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class NotificationType(str, Enum):
    info = "info"
    reminder = "reminder"
    update = "update"
    permission = "permission"
    warning = "warning"


class Notification(SQLModel, table=True):
    __tablename__ = "notifications"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    type: NotificationType = Field(default=NotificationType.info)
    message: str = Field(max_length=500)
    ref_type: str | None = Field(default=None, max_length=50)
    ref_id: uuid.UUID | None = Field(default=None)
    is_read: bool = Field(default=False, index=True)
    created_at: datetime = Field(default_factory=now_utc, index=True)


class SystemConfig(SQLModel, table=True):
    __tablename__ = "system_configs"

    key: str = Field(primary_key=True, max_length=100)
    value: dict | None = Field(default=None, sa_column=Column("value", JSON))
    updated_by: uuid.UUID | None = Field(default=None, foreign_key="users.id")
    updated_at: datetime = Field(default_factory=now_utc)


class AiConfig(SQLModel, table=True):
    __tablename__ = "ai_configs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    provider: str = Field(max_length=50, index=True)
    model: str = Field(max_length=100)
    api_key_encrypted: str | None = Field(default=None, max_length=500)
    default_prompt: str | None = Field(default=None)
    quota_limit: int | None = Field(default=None)
    is_active: bool = Field(default=False, index=True)
    updated_at: datetime = Field(default_factory=now_utc)
