"""
AI Operations Command Center — backend entry point.

Phase 1 scope: the application starts and serves a health endpoint. There is no
database, no AI agent, no tool layer, and no NovaCommerce simulation. Those are
introduced in Phases 9 through 14.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import health
from app.core.config import settings

app = FastAPI(
    title="AI Operations Command Center API",
    description=(
        "Backend for the AI Operations Command Center. "
        "Phase 1 — foundation only."
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
