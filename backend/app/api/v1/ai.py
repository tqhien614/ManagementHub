import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.ai import AiConversation, AiMessage, DocumentChunk
from app.models.auth import User
from app.schemas.ai import AskRequest, AskResponse, Citation, CopilotRequest, CopilotResponse, ConversationRead, MessageRead
from app.services.ai_rag import answer_question, has_embeddings, index_document, is_ai_enabled, llm_complete

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/status")
def ai_status(user: User = Depends(get_current_user)) -> dict:
    llm_ok = is_ai_enabled()
    emb_ok = has_embeddings()
    return {
        "enabled": llm_ok,
        "model": settings.ANTHROPIC_MODEL if llm_ok else None,
        "embedding": "text-embedding-3-small" if emb_ok else None,
        "search_mode": "vector" if emb_ok else "keyword",
        "message": "AI sẵn sàng" if llm_ok else "Chưa cấu hình Anthropic — trả lời theo từ khóa",
    }


@router.post("/ask", response_model=AskResponse)
def ask(payload: AskRequest, session: Session = Depends(get_session), user: User = Depends(get_current_user)) -> AskResponse:
    if not payload.question.strip():
        raise HTTPException(400, "Câu hỏi rỗng")
    result = answer_question(
        session,
        question=payload.question,
        product_id=payload.product_id,
        conversation_id=payload.conversation_id,
        user_id=user.id,
    )
    return AskResponse(
        answer=result["answer"],
        citations=[Citation(**c) for c in result["citations"]],
        tokens=result.get("tokens"),
        conversation_id=result.get("conversation_id"),
    )


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[AiConversation]:
    return list(session.exec(
        select(AiConversation).where(AiConversation.user_id == user.id).order_by(AiConversation.updated_at.desc())
    ).all())


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageRead])
def get_messages(
    conv_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[AiMessage]:
    conv = session.get(AiConversation, conv_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(404, "Không tìm thấy cuộc trò chuyện")
    return list(session.exec(
        select(AiMessage).where(AiMessage.conversation_id == conv_id).order_by(AiMessage.created_at.asc())
    ).all())


@router.post("/documents/{doc_id}/index")
def reindex_document(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    count = index_document(session, doc_id)
    return {"document_id": str(doc_id), "chunks": count}


# --- Copilot (inline editor assist) ---

@router.post("/copilot", response_model=CopilotResponse)
def copilot(payload: CopilotRequest, user: User = Depends(get_current_user)) -> CopilotResponse:
    if not is_ai_enabled():
        return CopilotResponse(text="(AI chưa cấu hình — Copilot không khả dụng)")
    if payload.mode == "summarize":
        instruction = f"Tóm tắt đoạn text sau thành 3-5 gạch đầu dòng:\n\n{payload.context}"
    elif payload.mode == "improve":
        instruction = f"Viết lại đoạn text sau cho rõ ràng, chuyên nghiệp hơn:\n\n{payload.context}"
    else:
        instruction = f"Viết tiếp/viết hoàn thiện đoạn text sau (giữ phong cách):\n\n{payload.context}\n\nYêu cầu: {payload.prompt}"
    try:
        text, _ = llm_complete(instruction, max_tokens=500)
        return CopilotResponse(text=text)
    except Exception as e:
        return CopilotResponse(text=f"(Lỗi: {e})")
