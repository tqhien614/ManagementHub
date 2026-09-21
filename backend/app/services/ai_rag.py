"""AI RAG service.

Two embedding storage modes:
- pgvector: column `embedding vector(1536)` + HNSW index (when extension installed)
- jsonb fallback: column `embedding JSONB` + cosine search via SQL (slower, no index)

Embeddings via OpenAI text-embedding-3-small (1536 dims). LLM via OpenAI
chat completions. Both require OPENAI_API_KEY in settings.
"""
import os
import uuid
from typing import Any

from sqlalchemy import text
from sqlmodel import Session, select

from app.core.config import settings
from app.models.ai import AiCitation, AiConversation, AiMessage, DocumentChunk
from app.models.workspace import Document, MarkdownContent
from app.services.chunker import split_markdown_by_headers


def is_ai_enabled() -> bool:
    """True if LLM (Anthropic) is configured — answer_question uses it."""
    return bool(settings.ANTHROPIC_AUTH_TOKEN and settings.ANTHROPIC_BASE_URL)


def has_embeddings() -> bool:
    """True if OpenAI embeddings key is configured."""
    return bool(settings.OPENAI_API_KEY)


# --- LLM (Anthropic via proxy) ---

def _llm_client():
    from anthropic import Anthropic
    return Anthropic(
        base_url=settings.ANTHROPIC_BASE_URL,
        auth_token=settings.ANTHROPIC_AUTH_TOKEN,
    )


def llm_complete(prompt: str, max_tokens: int = 800) -> tuple[str, int | None]:
    """Call Anthropic LLM. Returns (text, input_tokens)."""
    client = _llm_client()
    resp = client.messages.create(
        model=settings.ANTHROPIC_MODEL,
        max_tokens=max_tokens,
        messages=[{"role": "user", "content": prompt}],
    )
    text = resp.content[0].text if resp.content else ""
    return text, resp.usage.input_tokens if resp.usage else None


# --- Embedding (OpenAI, optional) ---

def get_embeddings(texts: list[str]) -> list[list[float]]:
    if not has_embeddings():
        raise RuntimeError("OPENAI_API_KEY chưa cấu hình — embeddings không khả dụng")
    from openai import OpenAI
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
    return [d.embedding for d in resp.data]


def get_embedding(text: str) -> list[float]:
    return get_embeddings([text])[0]


# --- pgvector availability ---

_pgvector_ok: bool | None = None


def pgvector_available(session: Session) -> bool:
    global _pgvector_ok
    if _pgvector_ok is not None:
        return _pgvector_ok
    try:
        session.execute(text("SELECT 1 FROM pg_extension WHERE extname='vector'"))
        row = session.execute(text("SELECT 1 FROM pg_extension WHERE extname='vector'")).first()
        _pgvector_ok = row is not None
    except Exception:
        _pgvector_ok = False
    return _pgvector_ok


# --- Index document ---

def index_document(session: Session, document_id: uuid.UUID) -> int:
    """Chunk the document's markdown and store embeddings. Returns chunk count."""
    md = session.exec(
        select(MarkdownContent).where(MarkdownContent.document_id == document_id)
    ).first()
    if not md:
        return 0

    # Remove existing chunks
    existing = session.exec(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id)
    ).all()
    for c in existing:
        session.delete(c)
    session.commit()

    chunks = split_markdown_by_headers(md.content_text)
    if not chunks:
        return 0

    if not has_embeddings():
        # Store chunks without embeddings (keyword search only)
        for c in chunks:
            session.add(DocumentChunk(
                document_id=document_id,
                header_path=c.header_path,
                chunk_index=c.chunk_index,
                content=c.content,
            ))
        session.commit()
        return len(chunks)

    # Batch embed
    try:
        embeddings = get_embeddings([c.content for c in chunks])
    except Exception as e:
        print(f"[ai] embedding failed: {e}; storing chunks without embeddings")
        for c in chunks:
            session.add(DocumentChunk(
                document_id=document_id,
                header_path=c.header_path,
                chunk_index=c.chunk_index,
                content=c.content,
            ))
        session.commit()
        return len(chunks)

    for c, emb in zip(chunks, embeddings):
        session.add(DocumentChunk(
            document_id=document_id,
            header_path=c.header_path,
            chunk_index=c.chunk_index,
            content=c.content,
        ))
    session.commit()

    # Write embeddings via raw SQL (pgvector or JSONB)
    _write_embeddings(session, document_id, chunks, embeddings)
    return len(chunks)


def _write_embeddings(session: Session, document_id: uuid.UUID, chunks, embeddings):
    import json
    rows = session.exec(
        select(DocumentChunk).where(DocumentChunk.document_id == document_id).order_by(DocumentChunk.chunk_index)
    ).all()
    for row, emb in zip(rows, embeddings):
        # Store as JSON string in Text column
        session.execute(text("UPDATE document_chunks SET embedding = :v WHERE id = :id"), {"v": json.dumps(emb), "id": str(row.id)})
    session.commit()


# --- Search ---

def search_chunks(session: Session, query: str, product_id: uuid.UUID | None = None, top_k: int = 5) -> list[tuple[DocumentChunk, float]]:
    """Return top-k chunks matching query. Each result: (chunk, score)."""
    if not has_embeddings():
        # Fallback: keyword search via ILIKE
        return _keyword_search(session, query, product_id, top_k)

    try:
        q_emb = get_embedding(query)
    except Exception as e:
        print(f"[ai] query embedding failed: {e}; using keyword fallback")
        return _keyword_search(session, query, product_id, top_k)

    use_pgvector = pgvector_available(session)
    import json
    if use_pgvector:
        emb_str = "[" + ",".join(str(x) for x in q_emb) + "]"
        if product_id:
            sql = text("""
                SELECT dc.id, dc.document_id, dc.header_path, dc.chunk_index, dc.content,
                       1 - (dc.embedding::jsonb::text::vector <=> :q::vector) AS score
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE dc.embedding IS NOT NULL AND d.product_id = :pid
                ORDER BY dc.embedding::jsonb::text::vector <=> :q::vector
                LIMIT :k
            """)
            params = {"q": emb_str, "k": top_k, "pid": str(product_id)}
        else:
            sql = text("""
                SELECT dc.id, dc.document_id, dc.header_path, dc.chunk_index, dc.content,
                       1 - (dc.embedding::jsonb::text::vector <=> :q::vector) AS score
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE dc.embedding IS NOT NULL
                ORDER BY dc.embedding::jsonb::text::vector <=> :q::vector
                LIMIT :k
            """)
            params = {"q": emb_str, "k": top_k}
    else:
        if product_id:
            sql = text("""
                SELECT dc.id, dc.document_id, dc.header_path, dc.chunk_index, dc.content
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE dc.embedding IS NOT NULL AND d.product_id = :pid
                LIMIT :k
            """)
            params = {"k": top_k, "pid": str(product_id)}
        else:
            sql = text("""
                SELECT dc.id, dc.document_id, dc.header_path, dc.chunk_index, dc.content
                FROM document_chunks dc
                JOIN documents d ON d.id = dc.document_id
                WHERE dc.embedding IS NOT NULL
                LIMIT :k
            """)
            params = {"k": top_k}

    try:
        result = session.execute(sql, params).fetchall()
        chunks = []
        for r in result:
            c = session.get(DocumentChunk, r[0])
            if c:
                chunks.append((c, float(r[5]) if r[5] is not None else 0.0))
        return chunks
    except Exception as e:
        print(f"[ai] vector search failed: {e}; keyword fallback")
        return _keyword_search(session, query, product_id, top_k)


def _keyword_search(session: Session, query: str, product_id: uuid.UUID | None, top_k: int) -> list[tuple[DocumentChunk, float]]:
    terms = query.strip().split()
    if not terms:
        return []
    like = " AND ".join([f"dc.content ILIKE :t{i}" for i in range(len(terms))])
    params = {f"t{i}": f"%{t}%" for i, t in enumerate(terms)}
    params["k"] = top_k
    if product_id:
        params["pid"] = str(product_id)
        pid_clause = "AND d.product_id = :pid"
    else:
        pid_clause = ""
    sql = text(f"""
        SELECT dc.id FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE {like if like else "TRUE"}
        {pid_clause}
        LIMIT :k
    """)
    rows = session.execute(sql, params).fetchall()
    return [(session.get(DocumentChunk, r[0]), 0.0) for r in rows]


# --- Answer ---

def answer_question(session: Session, question: str, product_id: uuid.UUID | None = None, conversation_id: uuid.UUID | None = None, user_id: uuid.UUID | None = None) -> dict:
    """RAG: search chunks → build context → LLM answer. Returns {answer, citations, tokens}."""
    chunks = search_chunks(session, question, product_id, top_k=5)
    context_parts = []
    citations = []
    for i, (c, score) in enumerate(chunks):
        doc = session.get(Document, c.document_id)
        if not doc:
            continue
        context_parts.append(f"[{i+1}] ({doc.title} > {c.header_path})\n{c.content}")
        citations.append({
            "document_id": str(doc.id),
            "document_title": doc.title,
            "header_path": c.header_path,
            "snippet": c.content[:200],
            "score": score,
        })

    context = "\n\n".join(context_parts) if context_parts else "(Không có tài liệu liên quan)"

    if not is_ai_enabled():
        answer = "AI chưa cấu hình (thiếu Anthropic credentials). Đây là các tài liệu liên quan theo từ khóa:\n\n"
        for i, c in enumerate(citations):
            answer += f"[{i+1}] {c['document_title']} — {c['header_path']}\n"
        return {"answer": answer, "citations": citations, "tokens": None, "conversation_id": None}

    prompt = f"""Bạn là trợ lý AI tra cứu tài liệu sản phẩm. Dựa trên các đoạn tài liệu dưới đây, trả lời câu hỏi. Trích dẫn nguồn bằng [1], [2]... tương ứng.

Tài liệu:
{context}

Câu hỏi: {question}

Trả lời (tiếng Việt, rõ ràng, có trích dẫn [số]):"""

    try:
        answer, tokens = llm_complete(prompt, max_tokens=800)
    except Exception as e:
        answer = f"Lỗi gọi LLM: {e}. Tài liệu liên quan:\n" + "\n".join(f"[{i+1}] {c['document_title']}" for i, c in enumerate(citations))
        tokens = None

    # Save to conversation
    if conversation_id is None:
        conv = AiConversation(user_id=user_id or uuid.UUID(int=0), product_id=product_id, title=question[:80])
        session.add(conv)
        session.commit()
        session.refresh(conv)
        conversation_id = conv.id
    session.add(AiMessage(conversation_id=conversation_id, role="user", content=question))
    msg = AiMessage(conversation_id=conversation_id, role="assistant", content=answer, tokens_used=tokens)
    session.add(msg)
    session.commit()
    session.refresh(msg)
    for c in citations:
        session.add(AiCitation(
            ai_message_id=msg.id,
            document_id=uuid.UUID(c["document_id"]),
            header_path=c["header_path"],
            snippet=c["snippet"],
        ))
    session.commit()

    return {"answer": answer, "citations": citations, "tokens": tokens, "conversation_id": str(conversation_id)}
