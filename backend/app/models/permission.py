import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class PrincipalType(str, Enum):
    user = "user"
    role = "role"


class FolderPermission(SQLModel, table=True):
    __tablename__ = "folder_permissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    folder_id: uuid.UUID = Field(foreign_key="folders.id", index=True, ondelete="CASCADE")
    principal_type: PrincipalType = Field(default=PrincipalType.user)
    principal_id: uuid.UUID = Field(index=True)
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_admin: bool = Field(default=False)
    created_at: datetime = Field(default_factory=now_utc)


class DocumentPermission(SQLModel, table=True):
    __tablename__ = "document_permissions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", index=True, ondelete="CASCADE"
    )
    principal_type: PrincipalType = Field(default=PrincipalType.user)
    principal_id: uuid.UUID = Field(index=True)
    can_view: bool = Field(default=True)
    can_edit: bool = Field(default=False)
    can_manage: bool = Field(default=False)
    created_at: datetime = Field(default_factory=now_utc)
