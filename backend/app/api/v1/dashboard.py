from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.ai import AiQueryLog
from app.models.auth import User
from app.models.workspace import Document, Product

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
def dashboard_stats(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> dict:
    doc_count = len(session.exec(select(Document)).all())
    product_count = len(session.exec(select(Product)).all())
    user_count = len(session.exec(select(User)).all())
    ai_queries = len(session.exec(select(AiQueryLog)).all())

    # Storage usage (sum of raw file sizes)
    import os
    from app.core.config import settings
    total_bytes = 0
    upload_dir = settings.UPLOAD_DIR
    if os.path.isdir(upload_dir):
        for dirpath, _, filenames in os.walk(upload_dir):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if os.path.isfile(fp):
                    total_bytes += os.path.getsize(fp)
    storage_mb = round(total_bytes / (1024 * 1024), 2)

    # Recent documents
    recent_docs = session.exec(select(Document).order_by(Document.created_at.desc()).limit(5)).all()
    recent = [{"id": str(d.id), "title": d.title, "status": d.status.value, "created_at": d.created_at.isoformat()} for d in recent_docs]

    return {
        "documents": doc_count,
        "products": product_count,
        "users": user_count,
        "ai_queries": ai_queries,
        "storage_mb": storage_mb,
        "recent_documents": recent,
    }
