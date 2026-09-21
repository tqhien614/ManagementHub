from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine

import app.models  # noqa: F401 — register all tables with SQLModel.metadata
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    future=True,
)


def init_db() -> None:
    """Create the pgvector extension (if available) then create all tables.

    document_chunks uses Vector(1536) when pgvector is installed, else falls
    back to a Text column storing JSON-encoded embeddings.
    """
    _ensure_pgvector()
    SQLModel.metadata.create_all(engine)


def _ensure_pgvector() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
        return True
    except Exception:
        return False


def get_session():
    with Session(engine) as session:
        yield session
