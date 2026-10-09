"""
Application configuration.

Phase 1: intentionally minimal. Values are read from environment variables with
safe defaults so the application starts with no configuration at all.

This still avoids a settings library: Phase 10 only adds a handful of database
variables, which do not justify one yet. The repo-root .env is read via python-dotenv.
"""

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import load_dotenv

# Load the repo-root .env (git-ignored) if present. Real environment variables win.
load_dotenv(Path(__file__).resolve().parents[3] / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    """Runtime configuration, resolved once at import time."""

    service_name: str = os.getenv(
        "SERVICE_NAME", "ai-operations-command-center-backend"
    )
    environment: str = os.getenv("ENVIRONMENT", "development")
    api_prefix: str = os.getenv("API_PREFIX", "/api")

    # Origins permitted to call this API from a browser.
    # Comma-separated in the environment; the frontend dev server by default.
    cors_origins_raw: str = os.getenv("CORS_ORIGINS", "http://localhost:3000")

    # Database (Phase 10). Either DATABASE_URL, or the POSTGRES_* parts. No defaults for
    # credentials: if nothing is configured, database_url is None and DB access raises.
    database_url_raw: str = os.getenv("DATABASE_URL", "")
    postgres_user: str = os.getenv("POSTGRES_USER", "")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "")
    postgres_db: str = os.getenv("POSTGRES_DB", "")
    postgres_host: str = os.getenv("POSTGRES_HOST", "localhost")
    postgres_port: str = os.getenv("POSTGRES_PORT", "5432")

    # LLM (Phase 14). Server-side only; no defaults, so nothing is guessed or hardcoded.
    llm_api_key: str = os.getenv("LLM_API_KEY", "")
    llm_model: str = os.getenv("LLM_MODEL", "")

    @property
    def database_url(self) -> str | None:
        if self.database_url_raw:
            return self.database_url_raw
        if not (self.postgres_user and self.postgres_db):
            return None
        return (
            f"postgresql+psycopg://{quote_plus(self.postgres_user)}:"
            f"{quote_plus(self.postgres_password)}@{self.postgres_host}:"
            f"{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]


settings = Settings()
