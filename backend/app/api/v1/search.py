import uuid

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, or_, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.workspace import Document, DocumentTag, MarkdownContent, Tag

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: str = Query(..., min_length=1),
    product_id: uuid.UUID | None = None,
    tag: str | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    pattern = f"%{q}%"
    matching_ids_subq = select(MarkdownContent.document_id).where(MarkdownContent.content_text.ilike(pattern))
    stmt = select(Document).where(
        or_(Document.title.ilike(pattern), Document.id.in_(matching_ids_subq))
    )
    if product_id:
        stmt = stmt.where(Document.product_id == product_id)

    docs = list(session.exec(stmt).all())

    if tag:
        tag_row = session.exec(select(Tag).where(Tag.name == tag)).first()
        if tag_row:
            tagged_ids = {dt.document_id for dt in session.exec(select(DocumentTag).where(DocumentTag.tag_id == tag_row.id)).all()}
            docs = [d for d in docs if d.id in tagged_ids]

    return {
        "query": q,
        "results": [
            {"id": str(d.id), "title": d.title, "status": d.status.value, "genre": d.genre, "product_id": str(d.product_id)}
            for d in docs
        ],
        "count": len(docs),
    }


@router.get("/tags")
def list_tags(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[dict]:
    rows = session.exec(select(Tag)).all()
    return [{"id": str(t.id), "name": t.name} for t in rows]
