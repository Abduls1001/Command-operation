"""
AI Operations Command Center — backend entry point.

Phase 1: the application starts and serves a health endpoint.
Phases 10-11: PostgreSQL-backed read-only NovaCommerce endpoints under the API prefix.
There is still no AI agent or tool layer.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, OperationalError

from app.api.routes import agent, health, incidents, novacommerce
from app.core.config import settings
from app.db.session import DatabaseNotConfigured

app = FastAPI(
    title="AI Operations Command Center API",
    description=(
        "Backend for the AI Operations Command Center. "
        "Backend & database — read-only NovaCommerce API."
    ),
    version="0.1.0",
)

# The frontend is a separate application on a separate origin, so the browser
# needs explicit permission to call this API. Origins come from the environment
# and default to the Next.js dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health lives at the root, not under the API prefix: it is infrastructure, not
# part of the domain API, and container orchestrators expect to find it there.
app.include_router(health.router)
app.include_router(novacommerce.router, prefix=settings.api_prefix)
app.include_router(agent.router, prefix=settings.api_prefix)
app.include_router(incidents.router, prefix=settings.api_prefix)


# A database that is missing or down should give a clear 503, not crash the app or
# leak a stack trace. Other errors are left alone so real bugs still surface.
def _db_unavailable(detail: str) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": detail})


@app.exception_handler(DatabaseNotConfigured)
async def _not_configured(_: Request, exc: DatabaseNotConfigured) -> JSONResponse:
    return _db_unavailable("Database is not configured.")


@app.exception_handler(OperationalError)
async def _db_down(_: Request, exc: OperationalError) -> JSONResponse:
    return _db_unavailable("Database is unavailable.")


@app.exception_handler(DBAPIError)
async def _db_error(_: Request, exc: DBAPIError) -> JSONResponse:
    # e.g. tables missing because the seed has not been run.
    return _db_unavailable("Database error. Has `python -m app.db.seed` been run?")
