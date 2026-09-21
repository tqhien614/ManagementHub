import uuid
from datetime import datetime
from enum import Enum

from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class ProductStatus(str, Enum):
    idea = "idea"
    draft = "draft"
    live = "live"


class DocumentStatus(str, Enum):
    draft = "draft"
    public = "public"


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=200, index=True)
    slug: str = Field(max_length=200, unique=True, index=True)
    description: str | None = Field(default=None)
    status: ProductStatus = Field(default=ProductStatus.idea, index=True)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class Folder(SQLModel, table=True):
    __tablename__ = "folders"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    product_id: uuid.UUID = Field(foreign_key="products.id", index=True, ondelete="CASCADE")
    parent_folder_id: uuid.UUID | None = Field(
        default=None, foreign_key="folders.id", index=True, ondelete="CASCADE"
    )
    name: str = Field(max_length=200)
    created_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class Document(SQLModel, table=True):
    __tablename__ = "documents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    folder_id: uuid.UUID | None = Field(
        default=None, foreign_key="folders.id", index=True, ondelete="SET NULL"
    )
    product_id: uuid.UUID = Field(foreign_key="products.id", index=True, ondelete="CASCADE")
    title: str = Field(max_length=300, index=True)
    raw_file_path: str | None = Field(default=None, max_length=500)
    status: DocumentStatus = Field(default=DocumentStatus.draft, index=True)
    genre: str = Field(default="general", max_length=50)
    owner_id: uuid.UUID = Field(foreign_key="users.id", index=True)
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)


class MarkdownContent(SQLModel, table=True):
    __tablename__ = "markdown_contents"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", unique=True, ondelete="CASCADE"
    )
    content_text: str = Field()
    updated_at: datetime = Field(default_factory=now_utc)


class DocumentVersion(SQLModel, table=True):
    __tablename__ = "document_versions"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="documents.id", index=True, ondelete="CASCADE")
    version_no: int = Field()
    content_text: str = Field()
    raw_file_path: str | None = Field(default=None, max_length=500)
    changed_by: uuid.UUID = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=now_utc, index=True)


class Tag(SQLModel, table=True):
    __tablename__ = "tags"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(max_length=50, unique=True, index=True)
    created_at: datetime = Field(default_factory=now_utc)


class DocumentTag(SQLModel, table=True):
    __tablename__ = "document_tags"

    document_id: uuid.UUID = Field(
        foreign_key="documents.id", primary_key=True, ondelete="CASCADE"
    )
    tag_id: uuid.UUID = Field(foreign_key="tags.id", primary_key=True, ondelete="CASCADE")
