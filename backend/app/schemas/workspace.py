import uuid
from datetime import datetime

from app.models.workspace import DocumentStatus, ProductStatus
from app.schemas.common import ORMBase


# Products
class ProductCreate(ORMBase):
    name: str
    slug: str
    description: str | None = None
    status: ProductStatus = ProductStatus.idea


class ProductRead(ORMBase):
    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    status: ProductStatus
    owner_id: uuid.UUID
    created_at: datetime


# Folders
class FolderCreate(ORMBase):
    product_id: uuid.UUID
    parent_folder_id: uuid.UUID | None = None
    name: str


class FolderRead(ORMBase):
    id: uuid.UUID
    product_id: uuid.UUID
    parent_folder_id: uuid.UUID | None = None
    name: str
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


# Documents
class DocumentRead(ORMBase):
    id: uuid.UUID
    folder_id: uuid.UUID | None = None
    product_id: uuid.UUID
    title: str
    raw_file_path: str | None = None
    status: DocumentStatus
    genre: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class DocumentUpdate(ORMBase):
    title: str | None = None
    status: DocumentStatus | None = None
    genre: str | None = None
    folder_id: uuid.UUID | None = None


class MarkdownRead(ORMBase):
    document_id: uuid.UUID
    content_text: str
    updated_at: datetime


class MarkdownUpdate(ORMBase):
    content_text: str


class VersionRead(ORMBase):
    id: uuid.UUID
    document_id: uuid.UUID
    version_no: int
    content_text: str
    changed_by: uuid.UUID
    created_at: datetime
