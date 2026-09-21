import uuid
from datetime import datetime

from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str
    product_id: uuid.UUID | None = None
    conversation_id: uuid.UUID | None = None


class Citation(BaseModel):
    document_id: str
    document_title: str
    header_path: str
    snippet: str
    score: float = 0.0


class AskResponse(BaseModel):
    answer: str
    citations: list[Citation] = []
    tokens: int | None = None
    conversation_id: str | None = None


class ConversationRead(BaseModel):
    id: uuid.UUID
    title: str
    product_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class MessageRead(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    tokens_used: int | None = None
    created_at: datetime


class CopilotRequest(BaseModel):
    prompt: str
    context: str = ""
    mode: str = "continue"  # continue | summarize | improve


class CopilotResponse(BaseModel):
    text: str
