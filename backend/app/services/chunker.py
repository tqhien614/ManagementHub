"""Split markdown into chunks by headers (MarkdownHeaderTextSplitter-style).

Pure-Python implementation — does not require langchain. Each chunk keeps
its header_path (e.g. "# H1 > ## H2") for citation back-references.
"""
import re
from dataclasses import dataclass


@dataclass
class Chunk:
    header_path: str
    content: str
    chunk_index: int = 0


def split_markdown_by_headers(md: str, max_chunk_chars: int = 1200) -> list[Chunk]:
    lines = md.split("\n")
    chunks: list[Chunk] = []
    current_headers: list[tuple[int, str]] = []  # (level, text)
    current_lines: list[str] = []

    def flush():
        text = "\n".join(current_lines).strip()
        if not text:
            return
        header_path = " > ".join(h[1] for h in current_headers) if current_headers else "(root)"
        chunks.append(Chunk(header_path=header_path, content=text))
        current_lines.clear()

    for line in lines:
        m = re.match(r"^(#{1,6})\s+(.+?)\s*#", line)
        if m:
            level = len(m.group(1))
            title = m.group(2).strip()
            flush()
            # Pop headers of same/higher level
            while current_headers and current_headers[-1][0] >= level:
                current_headers.pop()
            current_headers.append((level, title))
        else:
            current_lines.append(line)
    flush()

    # Split overly long chunks by paragraphs
    final: list[Chunk] = []
    idx = 0
    for c in chunks:
        if len(c.content) <= max_chunk_chars:
            final.append(Chunk(header_path=c.header_path, content=c.content, chunk_index=idx))
            idx += 1
        else:
            paragraphs = c.content.split("\n\n")
            buf = ""
            for p in paragraphs:
                if len(buf) + len(p) + 2 > max_chunk_chars and buf:
                    final.append(Chunk(header_path=c.header_path, content=buf.strip(), chunk_index=idx))
                    idx += 1
                    buf = p
                else:
                    buf = (buf + "\n\n" + p).strip() if buf else p
            if buf.strip():
                final.append(Chunk(header_path=c.header_path, content=buf.strip(), chunk_index=idx))
                idx += 1
    return final
