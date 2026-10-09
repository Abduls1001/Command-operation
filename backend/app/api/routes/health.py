"""
Health endpoint.

Reports that the backend process is up and serving requests. Nothing more.

"status" is liveness of the process only. Phase 10 adds a separate "database" field
("ok" / "unavailable" / "not_configured"); an unreachable database does not make the
process itself unhealthy, so "status" stays "ok". The LLM provider is not checked yet.
"""

from fastapi import APIRouter
from sqlalchemy import text

from app.core.config import settings
from app.db.session import get_engine

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check, plus whether the database answers."""
    if not settings.database_url:
        database = "not_configured"
    else:
        try:
            with get_engine().connect() as conn:
                conn.execute(text("SELECT 1"))
            database = "ok"
        except Exception:
            database = "unavailable"
    return {
        "status": "ok",
        "service": settings.service_name,
        "database": database,
    }
