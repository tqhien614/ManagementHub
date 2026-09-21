import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class Comment(SQLModel, table=True):
    __tablename__ = "comments"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="documents.id", index=True, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    content: str = Field()
    created_at: datetime = Field(default_factory=now_utc, index=True)


class MarkdownNote(SQLModel, table=True):
    __tablename__ = "markdown_notes"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(foreign_key="documents.id", index=True, ondelete="CASCADE")
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    anchor: str = Field(max_length=200)
    content: str = Field()
    created_at: datetime = Field(default_factory=now_utc, index=True)
