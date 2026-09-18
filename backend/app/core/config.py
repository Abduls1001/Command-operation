"""
Application configuration.

Phase 1: intentionally minimal. Values are read from environment variables with
safe defaults so the application starts with no configuration at all.

This deliberately avoids a settings library for now. Phase 10 introduces the
database and will need typed, validated settings; that is the point at which
pydantic-settings should be adopted, not before.
"""

import os
from dataclasses import dataclass


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

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_raw.split(",")
            if origin.strip()
        ]


settings = Settings()
