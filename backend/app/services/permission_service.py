"""Resolve a user's effective permission on a document or folder.

Inheritance: document_permissions override folder_permissions. Owner/admin
always full access. Folders propagate permissions to subfolders and their docs
(M3 inheritance; implemented via recursive folder lookup).
"""
import uuid

from sqlmodel import Session, select

from app.models.auth import Role, RoleName, User, UserRole
from app.models.permission import DocumentPermission, FolderPermission, PrincipalType
from app.models.workspace import Document, Folder
from app.schemas.permission import ResolvedPermission


def resolve_document_permission(
    session: Session, doc: Document, user: User
) -> ResolvedPermission:
    if doc.owner_id == user.id or user.is_admin:
        return ResolvedPermission(can_view=True, can_edit=True, can_admin=True, source="owner" if doc.owner_id == user.id else "admin")

    # Document-level override
    doc_perm = _match_document_perms(session, doc.id, user)
    if doc_perm:
        return ResolvedPermission(
            can_view=doc_perm.can_view,
            can_edit=doc_perm.can_edit,
            can_admin=doc_perm.can_manage,
            source="document",
        )

    # Folder inheritance (walk up parent chain)
    if doc.folder_id:
        perm = resolve_folder_permission(session, doc.folder_id, user)
        return ResolvedPermission(
            can_view=perm.can_view,
            can_edit=perm.can_edit,
            can_admin=perm.can_admin,
            source="folder",
        )

    # Public docs: view only
    if doc.status.value == "public":
        return ResolvedPermission(can_view=True, can_edit=False, can_admin=False, source="none")
    return ResolvedPermission(can_view=False, can_edit=False, can_admin=False, source="none")


def resolve_folder_permission(
    session: Session, folder_id: uuid.UUID, user: User
) -> ResolvedPermission:
    # Walk up the parent chain accumulating the first matching perm
    current = folder_id
    visited = set()
    while current and current not in visited:
        visited.add(current)
        perm = _match_folder_perms(session, current, user)
        if perm:
            return ResolvedPermission(
                can_view=perm.can_view,
                can_edit=perm.can_edit,
                can_admin=perm.can_admin,
                source="folder",
            )
        folder = session.get(Folder, current)
        if not folder:
            break
        current = folder.parent_folder_id
    return ResolvedPermission(can_view=False, can_edit=False, can_admin=False, source="none")


def _match_document_perms(session: Session, doc_id: uuid.UUID, user: User):
    user_ids = _user_and_role_ids(session, user)
    perms = session.exec(
        select(DocumentPermission).where(DocumentPermission.document_id == doc_id)
    ).all()
    return _pick(perms, user_ids, user.id)


def _match_folder_perms(session: Session, folder_id: uuid.UUID, user: User):
    user_ids = _user_and_role_ids(session, user)
    perms = session.exec(
        select(FolderPermission).where(FolderPermission.folder_id == folder_id)
    ).all()
    return _pick(perms, user_ids, user.id)


def _pick(perms, user_and_role_ids: set, user_id: uuid.UUID):
    # Direct user match wins over role match
    user_perm = next((p for p in perms if p.principal_type == PrincipalType.user and p.principal_id == user_id), None)
    if user_perm:
        return user_perm
    role_perm = next((p for p in perms if p.principal_type == PrincipalType.role and p.principal_id in user_and_role_ids), None)
    return role_perm


def _user_and_role_ids(session: Session, user: User) -> set:
    rows = session.exec(select(UserRole).where(UserRole.user_id == user.id)).all()
    return {r.role_id for r in rows}
