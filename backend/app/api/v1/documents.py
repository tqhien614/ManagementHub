import os
import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.workspace import (
    Document,
    DocumentStatus,
    DocumentVersion,
    MarkdownContent,
)
from app.schemas.workspace import (
    DocumentRead,
    DocumentUpdate,
    MarkdownRead,
    MarkdownUpdate,
    VersionRead,
)
from app.services.converter import convert_to_markdown, is_supported, save_raw_file
from app.services.permission_service import resolve_document_permission
from app.services.ai_rag import index_document as ai_index_document
from app.api.v1.activity_log import log_activity

router = APIRouter(prefix="/documents", tags=["documents"])


def _can_access(doc: Document, user: User, session: Session) -> bool:
    perm = resolve_document_permission(session, doc, user)
    return perm.can_view


def _can_edit(doc: Document, user: User, session: Session) -> bool:
    perm = resolve_document_permission(session, doc, user)
    return perm.can_edit


def _can_admin(doc: Document, user: User, session: Session) -> bool:
    perm = resolve_document_permission(session, doc, user)
    return perm.can_admin


@router.get("", response_model=list[DocumentRead])
def list_documents(
    product_id: uuid.UUID | None = None,
    status_filter: DocumentStatus | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Document]:
    stmt = select(Document).order_by(Document.created_at.desc())
    if product_id:
        stmt = stmt.where(Document.product_id == product_id)
    if status_filter:
        stmt = stmt.where(Document.status == status_filter)
    docs = list(session.exec(stmt).all())
    # Filter by access (M3 sẽ thay bằng permission service)
    return [d for d in docs if _can_access(d, user, session)]


@router.post("/upload", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    product_id: uuid.UUID = Form(...),
    title: str = Form(...),
    folder_id: uuid.UUID | None = Form(default=None),
    genre: str = Form(default="general"),
    status_doc: str = Form(default="draft"),
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Document:
    if not file.filename or not is_supported(file.filename):
        raise HTTPException(400, f"File không hợp lệ. Hỗ trợ: {', '.join(sorted(['.pdf','.docx','.doc','.pptx','.html','.txt','.md']))}")
    content = await file.read()
    if not content:
        raise HTTPException(400, "File rỗng")

    doc_id = uuid.uuid4()
    doc_id_str = str(doc_id)

    # Save raw
    raw_rel = save_raw_file(content, doc_id_str, file.filename)

    # Convert to markdown
    assets_dir = os.path.join(settings.UPLOAD_DIR, doc_id_str, "assets")
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        tmp.write(content)
        tmp_path = tmp.name
    try:
        md_text = convert_to_markdown(tmp_path, assets_dir)
    except Exception as e:
        os.unlink(tmp_path)
        raise HTTPException(500, f"Lỗi chuyển đổi: {e}")
    finally:
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)

    # Create document + markdown
    doc = Document(
        id=doc_id,
        folder_id=folder_id,
        product_id=product_id,
        title=title,
        raw_file_path=raw_rel,
        status=DocumentStatus(status_doc) if status_doc in ("draft", "public") else DocumentStatus.draft,
        genre=genre,
        owner_id=user.id,
    )
    session.add(doc)
    session.commit()
    session.refresh(doc)

    md = MarkdownContent(document_id=doc.id, content_text=md_text)
    session.add(md)

    v1 = DocumentVersion(
        document_id=doc.id,
        version_no=1,
        content_text=md_text,
        raw_file_path=raw_rel,
        changed_by=user.id,
    )
    session.add(v1)
    session.commit()

    # Auto-index for AI search (chunks only if AI enabled; keyword fallback stores chunks anyway)
    try:
        ai_index_document(session, doc.id)
    except Exception as e:
        print(f"[ai] auto-index failed on upload: {e}")

    log_activity(session, user.id, "upload_document", "document", doc.id, {"title": doc.title})
    return doc


@router.get("/{doc_id}", response_model=DocumentRead)
def get_document(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Document:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Bạn không có quyền xem tài liệu này")
    return doc


@router.patch("/{doc_id}", response_model=DocumentRead)
def update_document(
    doc_id: uuid.UUID,
    payload: DocumentUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Document:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_edit(doc, user, session):
        raise HTTPException(403, "Bạn không có quyền sửa tài liệu này")
    if payload.title is not None:
        doc.title = payload.title
    if payload.status is not None:
        doc.status = payload.status
    if payload.genre is not None:
        doc.genre = payload.genre
    if payload.folder_id is not None:
        doc.folder_id = payload.folder_id
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return doc


@router.delete("/{doc_id}", status_code=204)
def delete_document(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_admin(doc, user, session):
        raise HTTPException(403, "Bạn không có quyền xóa tài liệu này")
    log_activity(session, user.id, "delete_document", "document", doc.id, {"title": doc.title})
    session.delete(doc)
    session.commit()


@router.get("/{doc_id}/markdown", response_model=MarkdownRead)
def get_markdown(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MarkdownContent:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Không có quyền xem")
    md = session.exec(select(MarkdownContent).where(MarkdownContent.document_id == doc_id)).first()
    if not md:
        raise HTTPException(404, "Chưa có nội dung markdown")
    return md


@router.put("/{doc_id}/markdown", response_model=MarkdownRead)
def update_markdown(
    doc_id: uuid.UUID,
    payload: MarkdownUpdate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> MarkdownContent:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_edit(doc, user, session):
        raise HTTPException(403, "Bạn không có quyền sửa tài liệu này")
    md = session.exec(select(MarkdownContent).where(MarkdownContent.document_id == doc_id)).first()
    if not md:
        md = MarkdownContent(document_id=doc.id, content_text=payload.content_text)
    else:
        md.content_text = payload.content_text
    session.add(md)
    # Create new version
    last_v = session.exec(
        select(DocumentVersion).where(DocumentVersion.document_id == doc_id).order_by(DocumentVersion.version_no.desc())
    ).first()
    next_no = (last_v.version_no + 1) if last_v else 1
    session.add(DocumentVersion(
        document_id=doc.id,
        version_no=next_no,
        content_text=payload.content_text,
        changed_by=user.id,
    ))
    session.commit()
    session.refresh(md)

    # Re-index after markdown edit
    try:
        ai_index_document(session, doc.id)
    except Exception as e:
        print(f"[ai] re-index failed: {e}")

    return md


@router.get("/{doc_id}/versions", response_model=list[VersionRead])
def list_versions(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[DocumentVersion]:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Không có quyền xem")
    return list(session.exec(
        select(DocumentVersion).where(DocumentVersion.document_id == doc_id).order_by(DocumentVersion.version_no.desc())
    ).all())


@router.get("/{doc_id}/versions/{version_no}", response_model=VersionRead)
def get_version(
    doc_id: uuid.UUID,
    version_no: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> DocumentVersion:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Không có quyền xem")
    v = session.exec(
        select(DocumentVersion).where(
            DocumentVersion.document_id == doc_id,
            DocumentVersion.version_no == version_no,
        )
    ).first()
    if not v:
        raise HTTPException(404, "Không tìm thấy phiên bản")
    return v


@router.get("/{doc_id}/download/raw")
def download_raw(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FileResponse:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Không có quyền")
    if not doc.raw_file_path:
        raise HTTPException(404, "Không có file gốc")
    path = doc.raw_file_path
    if not os.path.isabs(path):
        path = os.path.join(os.getcwd(), path)
    if not os.path.isfile(path):
        raise HTTPException(404, "File gốc không còn tồn tại")
    return FileResponse(path, filename=os.path.basename(path))


@router.get("/{doc_id}/download/markdown")
def download_markdown(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FileResponse:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    if not _can_access(doc, user, session):
        raise HTTPException(403, "Không có quyền")
    md = session.exec(select(MarkdownContent).where(MarkdownContent.document_id == doc_id)).first()
    if not md:
        raise HTTPException(404, "Chưa có markdown")
    import tempfile
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".md", mode="w", encoding="utf-8")
    tmp.write(md.content_text)
    tmp.close()
    return FileResponse(tmp.name, filename=f"{doc.title}.md", media_type="text/markdown")
