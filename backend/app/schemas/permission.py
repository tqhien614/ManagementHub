import uuid
from datetime import datetime

from app.models.permission import PrincipalType
from app.schemas.common import ORMBase


class PermissionCreate(ORMBase):
    principal_type: PrincipalType = PrincipalType.user
    principal_id: uuid.UUID
    can_view: bool = True
    can_edit: bool = False
    can_admin: bool = False
    can_manage: bool = False


class FolderPermissionRead(ORMBase):
    id: uuid.UUID
    folder_id: uuid.UUID
    principal_type: PrincipalType
    principal_id: uuid.UUID
    can_view: bool
    can_edit: bool
    can_admin: bool
    created_at: datetime


class DocumentPermissionRead(ORMBase):
    id: uuid.UUID
    document_id: uuid.UUID
    principal_type: PrincipalType
    principal_id: uuid.UUID
    can_view: bool
    can_edit: bool
    can_manage: bool
    created_at: datetime


class ResolvedPermission(ORMBase):
    can_view: bool
    can_edit: bool
    can_admin: bool
    source: str  # "owner" | "admin" | "document" | "folder" | "none"
