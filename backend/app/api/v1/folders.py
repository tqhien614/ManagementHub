import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.workspace import Document, Folder
from app.schemas.workspace import FolderCreate, FolderRead

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("", response_model=list[FolderRead])
def list_folders(
    product_id: uuid.UUID | None = None,
    parent_folder_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> list[Folder]:
    stmt = select(Folder).order_by(Folder.name.asc())
    if product_id:
        stmt = stmt.where(Folder.product_id == product_id)
    if parent_folder_id:
        stmt = stmt.where(Folder.parent_folder_id == parent_folder_id)
    elif parent_folder_id is None and product_id:
        stmt = stmt.where(Folder.parent_folder_id.is_(None))
    return list(session.exec(stmt).all())


@router.post("", response_model=FolderRead, status_code=201)
def create_folder(
    payload: FolderCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Folder:
    # Check name uniqueness at same level
    existing = session.exec(
        select(Folder).where(
            Folder.product_id == payload.product_id,
            Folder.parent_folder_id == payload.parent_folder_id,
            Folder.name == payload.name,
        )
    ).first()
    if existing:
        raise HTTPException(409, "Tên thư mục đã tồn tại ở cấp này")
    folder = Folder(
        product_id=payload.product_id,
        parent_folder_id=payload.parent_folder_id,
        name=payload.name,
        created_by=user.id,
    )
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


@router.patch("/{folder_id}", response_model=FolderRead)
def rename_folder(
    folder_id: uuid.UUID,
    name: str,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Folder:
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    existing = session.exec(
        select(Folder).where(
            Folder.product_id == folder.product_id,
            Folder.parent_folder_id == folder.parent_folder_id,
            Folder.name == name,
            Folder.id != folder_id,
        )
    ).first()
    if existing:
        raise HTTPException(409, "Tên thư mục đã tồn tại ở cấp này")
    folder.name = name
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


@router.post("/{folder_id}/move", response_model=FolderRead)
def move_folder(
    folder_id: uuid.UUID,
    new_parent_id: uuid.UUID | None = None,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
) -> Folder:
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    if new_parent_id == folder.id:
        raise HTTPException(400, "Không thể chuyển vào chính nó")
    if new_parent_id:
        parent = session.get(Folder, new_parent_id)
        if not parent or parent.product_id != folder.product_id:
            raise HTTPException(400, "Thư mục cha không hợp lệ")
    folder.parent_folder_id = new_parent_id
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


@router.delete("/{folder_id}", status_code=204)
def delete_folder(
    folder_id: uuid.UUID,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    folder = session.get(Folder, folder_id)
    if not folder:
        raise HTTPException(404, "Không tìm thấy thư mục")
    children = session.exec(select(Folder).where(Folder.parent_folder_id == folder_id)).first()
    docs = session.exec(select(Document).where(Document.folder_id == folder_id)).first()
    if children or docs:
        raise HTTPException(409, "Thư mục chứa tài liệu hoặc thư mục con — không thể xóa. Di chuyển hoặc xóa nội dung trước.")
    session.delete(folder)
    session.commit()
