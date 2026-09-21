import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.permission import DocumentPermission, FolderPermission
from app.models.workspace import Document, Folder
from app.schemas.permission import (
    DocumentPermissionRead,
    FolderPermissionRead,
    PermissionCreate,
    ResolvedPermission,
)
from app.services.permission_service import resolve_document_permission, resolve_folder_permission

router = APIRouter(prefix="/permissions", tags=["permissions"])


# --- Folder permissions ---

@router.get("/folders/{folder_id}", response_model=list[FolderPermissionRead])
def list_folder_permissions(
    folder_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[FolderPermission]:
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    perm = resolve_folder_permission(session, folder_id, user)
    if not perm.can_admin and not user.is_admin:
        raise HTTPException(403, "Bạn cần quyền admin trên thư mục để xem phân quyền")
    return list(session.exec(select(FolderPermission).where(FolderPermission.folder_id == folder_id)).all())


@router.post("/folders/{folder_id}", response_model=FolderPermissionRead, status_code=201)
def set_folder_permission(
    folder_id: uuid.UUID,
    payload: PermissionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> FolderPermission:
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    perm = resolve_folder_permission(session, folder_id, user)
    if not perm.can_admin and not user.is_admin:
        raise HTTPException(403, "Bạn cần quyền admin trên thư mục để phân quyền")
    existing = session.exec(
        select(FolderPermission).where(
            FolderPermission.folder_id == folder_id,
            FolderPermission.principal_type == payload.principal_type,
            FolderPermission.principal_id == payload.principal_id,
        )
    ).first()
    if existing:
        existing.can_view = payload.can_view
        existing.can_edit = payload.can_edit
        existing.can_admin = payload.can_admin
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    fp = FolderPermission(
        folder_id=folder_id,
        principal_type=payload.principal_type,
        principal_id=payload.principal_id,
        can_view=payload.can_view,
        can_edit=payload.can_edit,
        can_admin=payload.can_admin,
    )
    session.add(fp)
    session.commit()
    session.refresh(fp)
    return fp


@router.delete("/folders/{folder_id}/{perm_id}", status_code=204)
def delete_folder_permission(
    folder_id: uuid.UUID,
    perm_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    perm = resolve_folder_permission(session, folder_id, user)
    if not perm.can_admin and not user.is_admin:
        raise HTTPException(403, "Bạn cần quyền admin trên thư mục")
    fp = session.get(FolderPermission, perm_id)
    if fp and fp.folder_id == folder_id:
        session.delete(fp)
        session.commit()


# --- Document permissions ---

@router.get("/documents/{doc_id}", response_model=list[DocumentPermissionRead])
def list_document_permissions(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[DocumentPermission]:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    perm = resolve_document_permission(session, doc, user)
    if not perm.can_admin and not user.is_admin:
        raise HTTPException(403, "Bạn cần quyền admin/quản lý để xem phân quyền")
    return list(session.exec(select(DocumentPermission).where(DocumentPermission.document_id == doc_id)).all())


@router.post("/documents/{doc_id}", response_model=DocumentPermissionRead, status_code=201)
def set_document_permission(
    doc_id: uuid.UUID,
    payload: PermissionCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> DocumentPermission:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    perm = resolve_document_permission(session, doc, user)
    if not perm.can_admin and not user.is_admin:
        raise HTTPException(403, "Bạn cần quyền admin/quản lý để phân quyền")
    existing = session.exec(
        select(DocumentPermission).where(
            DocumentPermission.document_id == doc_id,
            DocumentPermission.principal_type == payload.principal_type,
            DocumentPermission.principal_id == payload.principal_id,
        )
    ).first()
    if existing:
        existing.can_view = payload.can_view
        existing.can_edit = payload.can_edit
        existing.can_manage = payload.can_admin
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing
    dp = DocumentPermission(
        document_id=doc_id,
        principal_type=payload.principal_type,
        principal_id=payload.principal_id,
        can_view=payload.can_view,
        can_edit=payload.can_edit,
        can_manage=payload.can_admin,
    )
    session.add(dp)
    session.commit()
    session.refresh(dp)
    return dp


# --- Resolve (check) ---

@router.get("/documents/{doc_id}/resolve", response_model=ResolvedPermission)
def resolve_doc_perm(
    doc_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> ResolvedPermission:
    doc = session.get(Document, doc_id)
    if not doc:
        raise HTTPException(404, "Không tìm thấy tài liệu")
    return resolve_document_permission(session, doc, user)
