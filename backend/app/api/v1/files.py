import os

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from app.core.config import settings

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/avatars/{user_id}/{filename}")
def get_avatar(user_id: str, filename: str):
    safe = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, "avatars", user_id, safe)
    if not os.path.isfile(path):
        raise HTTPException(404, "Không tìm thấy ảnh")
    return FileResponse(path)


@router.get("/documents/{doc_id}/assets/{filename}")
def get_document_asset(doc_id: str, filename: str):
    safe = os.path.basename(filename)
    path = os.path.join(settings.UPLOAD_DIR, doc_id, "assets", safe)
    if not os.path.isfile(path):
        raise HTTPException(404, "Không tìm thấy ảnh")
    return FileResponse(path)
