"""Engine and session handling. The engine is created lazily, so the app (and the
Phase 9 simulation) start fine even when no database is configured or reachable."""

from collections.abc import Iterator
from functools import lru_cache

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


class DatabaseNotConfigured(RuntimeError):
    """Raised when no database settings are present in the environment."""


@lru_cache
def get_engine() -> Engine:
    url = settings.database_url
    if not url:
        raise DatabaseNotConfigured(
            "Database is not configured. Set DATABASE_URL or POSTGRES_USER / "
            "POSTGRES_PASSWORD / POSTGRES_DB (see .env.example)."
        )
    return create_engine(url, pool_pre_ping=True, connect_args={"connect_timeout": 5})


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    with sessionmaker(bind=get_engine(), expire_on_commit=False)() as session:
        yield session
