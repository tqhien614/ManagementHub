"""Document → Markdown converter pipeline.

Primary: Docling (when installed). Fallback: pymupdf (PDF) + mammoth (DOCX) +
markdownify (HTML→MD). For plain .md/.txt files, content is returned as-is.
"""
import os
from pathlib import Path

from app.core.config import settings

_DOCLING = None
try:
    from docling.document_converter import DocumentConverter  # type: ignore

    _DOCLING = DocumentConverter()
except Exception:
    _DOCLING = None


SUPPORTED_RAW = {".pdf", ".docx", ".doc", ".pptx", ".html", ".htm", ".txt", ".md"}


def is_supported(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in SUPPORTED_RAW


def convert_to_markdown(file_path: str, out_dir: str) -> str:
    """Convert the file at file_path to markdown. Returns markdown string.

    `out_dir` is where extracted images may be written (relative asset paths).
    """
    path = Path(file_path)
    ext = path.suffix.lower()

    if ext in {".md", ".txt"}:
        return path.read_text(encoding="utf-8", errors="replace")

    if _DOCLING is not None:
        try:
            return _convert_with_docling(str(path), out_dir)
        except Exception as e:
            print(f"[converter] docling failed for {path.name}: {e}; falling back")

    if ext == ".pdf":
        return _convert_pdf_pymupdf(str(path), out_dir)
    if ext in {".docx", ".doc"}:
        return _convert_docx_mammoth(str(path), out_dir)
    if ext in {".html", ".htm"}:
        return _convert_html(str(path))
    raise ValueError(f"Không hỗ trợ định dạng: {ext}")


def _convert_with_docling(file_path: str, out_dir: str) -> str:
    result = _DOCLING.convert(file_path)
    return result.document.export_to_markdown()


def _convert_pdf_pymupdf(file_path: str, out_dir: str) -> str:
    import fitz  # pymupdf
    import re

    os.makedirs(out_dir, exist_ok=True)
    doc = fitz.open(file_path)
    parts: list[str] = []
    img_idx = 0
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text") or ""
        if text.strip():
            parts.append(text.strip())
        for img_info in page.get_images(full=True):
            xref = img_info[0]
            try:
                pix = fitz.Pixmap(doc, xref)
                if pix.n - pix.alpha >= 4:
                    pix = fitz.Pixmap(fitz.csRGB, pix)
                fname = f"page{page_num}_img{img_idx}.png"
                pix.save(os.path.join(out_dir, fname))
                parts.append(f"\n![image](assets/{fname})\n")
                img_idx += 1
                pix = None
            except Exception:
                continue
        parts.append("\n\n---\n\n")
    doc.close()
    md = "\n".join(parts)
    if not md.strip():
        md = "_(Tài liệu không chứa văn bản — có thể là ảnh scan. OCR chưa hỗ trợ ở MVP.)_"
    return md


def _convert_docx_mammoth(file_path: str, out_dir: str) -> str:
    import mammoth
    from markdownify import markdownify as md_convert
    import os

    os.makedirs(out_dir, exist_ok=True)

    with open(file_path, "rb") as f:
        result = mammoth.convert_to_html(f)
    html = result.value

    # Extract embedded images (mammoth leaves them as <img src="data:...">)
    import re
    import base64
    img_idx = 0

    def _save_img(match: re.Match) -> str:
        nonlocal img_idx
        data_uri = match.group(1)
        if "," not in data_uri:
            return match.group(0)
        meta, b64 = data_uri.split(",", 1)
        ext = "png"
        if "image/jpeg" in meta or "image/jpg" in meta:
            ext = "jpg"
        elif "image/gif" in meta:
            ext = "gif"
        fname = f"img{img_idx}.{ext}"
        with open(os.path.join(out_dir, fname), "wb") as out:
            out.write(base64.b64decode(b64))
        img_idx += 1
        return f"assets/{fname}"

    html = re.sub(r'<img[^>]+src="(data:[^"]+)"[^>]*>', lambda m: f'<img src="{_save_img(m)}">', html)
    return md_convert(html, heading_style="ATX")


def _convert_html(file_path: str) -> str:
    from markdownify import markdownify as md_convert
    html = Path(file_path).read_text(encoding="utf-8", errors="replace")
    return md_convert(html, heading_style="ATX")


def save_raw_file(file_bytes: bytes, doc_id: str, filename: str) -> str:
    """Save uploaded raw file under storage/uploads/<doc_id>/raw/<filename>."""
    raw_dir = os.path.join(settings.UPLOAD_DIR, doc_id, "raw")
    os.makedirs(raw_dir, exist_ok=True)
    safe = os.path.basename(filename)
    path = os.path.join(raw_dir, safe)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return f"storage/uploads/{doc_id}/raw/{safe}"
