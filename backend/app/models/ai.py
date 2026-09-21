import uuid
from datetime import datetime
from enum import Enum

from sqlalchemy import Column, Text
from sqlmodel import Field, SQLModel

from app.core.timeutil import now_utc


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


class AiConversation(SQLModel, table=True):
    __tablename__ = "ai_conversations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    product_id: uuid.UUID | None = Field(
        default=None, foreign_key="products.id", index=True, ondelete="SET NULL"
    )
    title: str = Field(default="New conversation", max_length=300)
    created_at: datetime = Field(default_factory=now_utc, index=True)
    updated_at: datetime = Field(default_factory=now_utc)


class AiMessage(SQLModel, table=True):
    __tablename__ = "ai_messages"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    conversation_id: uuid.UUID = Field(
        foreign_key="ai_conversations.id", index=True, ondelete="CASCADE"
    )
    role: MessageRole = Field()
    content: str = Field()
    tokens_used: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=now_utc, index=True)


class AiCitation(SQLModel, table=True):
    __tablename__ = "ai_citations"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    ai_message_id: uuid.UUID = Field(
        foreign_key="ai_messages.id", index=True, ondelete="CASCADE"
    )
    document_id: uuid.UUID = Field(foreign_key="documents.id", index=True)
    header_path: str = Field(default="", max_length=500)
    snippet: str = Field(default="")


class DocumentChunk(SQLModel, table=True):
    __tablename__ = "document_chunks"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(
        foreign_key="documents.id", index=True, ondelete="CASCADE"
    )
    header_path: str = Field(default="", max_length=500)
    chunk_index: int = Field(default=0)
    content: str = Field()
    token_count: int | None = Field(default=None)
    # Embedding stored as TEXT (JSON-encoded). Converted to vector/jsonb via
    # raw SQL at query time if pgvector is available, else used directly.
    embedding: str | None = Field(default=None, sa_column=Column("embedding", Text, nullable=True))
    created_at: datetime = Field(default_factory=now_utc)


class AiQueryLog(SQLModel, table=True):
    __tablename__ = "ai_query_logs"

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    user_id: uuid.UUID = Field(foreign_key="users.id", index=True, ondelete="CASCADE")
    conversation_id: uuid.UUID | None = Field(
        default=None, foreign_key="ai_conversations.id", ondelete="SET NULL"
    )
    prompt_tokens: int | None = Field(default=None)
    completion_tokens: int | None = Field(default=None)
    cost_usd: float | None = Field(default=None)
    latency_ms: int | None = Field(default=None)
    created_at: datetime = Field(default_factory=now_utc, index=True)
