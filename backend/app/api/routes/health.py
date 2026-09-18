"""
Health endpoint.

Reports that the backend process is up and serving requests. Nothing more.

It deliberately does not check the database, the LLM provider, or any
NovaCommerce system — none of those exist yet, and a health check that reports
on dependencies it does not have is worse than none. Dependency checks are added
in the phases that introduce the dependencies.
"""

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check."""
    return {
        "status": "ok",
        "service": settings.service_name,
    }
