from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  — registers all tables with SQLModel.metadata
from app.api.v1 import (
    activity_log,
    admin_users,
    ai,
    ai_config,
    ai_logs,
    auth,
    dashboard,
    documents,
    files,
    folders,
    health,
    notifications,
    permissions,
    products,
    roles,
    search,
    system_config,
    users,
)
from app.core.config import settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="AI-PDMH API",
    version="0.1.0",
    description="AI Product Document Management Hub backend",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(folders.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(permissions.router, prefix="/api/v1")
app.include_router(roles.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(ai_logs.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1")
app.include_router(system_config.router, prefix="/api/v1")
app.include_router(ai_config.router, prefix="/api/v1")
app.include_router(activity_log.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
