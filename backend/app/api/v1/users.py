from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import get_session
from app.core.deps import get_current_user
from app.models.auth import User
from app.models.workspace import Document
from app.schemas.auth import UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
def get_me(user: User = Depends(get_current_user)) -> User:
    return user


@router.patch("/me", response_model=UserRead)
def update_me(
    payload: UserUpdate,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> User:
    if payload.display_name is not None:
        user.display_name = payload.display_name
    if payload.bio is not None:
        user.bio = payload.bio
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.post("/me/avatar", response_model=UserRead)
async def upload_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> User:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(400, "File phải là ảnh")
    import aiofiles
    import os
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars", str(user.id))
    os.makedirs(avatar_dir, exist_ok=True)
    ext = file.filename.rsplit(".", 1)[-1] if file.filename else "png"
    filename = f"avatar.{ext}"
    path = os.path.join(avatar_dir, filename)
    async with aiofiles.open(path, "wb") as f:
        await f.write(await file.read())
    user.avatar_url = f"/api/v1/files/avatars/{user.id}/{filename}"
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@router.get("/me/documents", response_model=list[dict])
def my_documents(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
) -> list[dict]:
    docs = session.exec(
        select(Document).where(Document.owner_id == user.id).order_by(Document.created_at.desc())
    ).all()
    return [
        {
            "id": str(d.id),
            "title": d.title,
            "status": d.status.value,
            "genre": d.genre,
            "product_id": str(d.product_id),
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]
