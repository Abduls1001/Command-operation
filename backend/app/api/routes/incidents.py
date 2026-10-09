"""Phase 16: GET /api/incidents/active — incidents detected from the NovaCommerce data."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api import schemas
from app.db.session import get_db
from app.incidents import detect_incidents

router = APIRouter(prefix="/incidents", tags=["incidents"])

DB = Annotated[Session, Depends(get_db)]


@router.get("/active", response_model=list[schemas.IncidentOut])
def list_active_incidents(db: DB):
    """Currently active incidents, most severe first. Empty list when all is well.

    Read-only; detection is deterministic (app/incidents/detection.py), no LLM involved."""
    return detect_incidents(db)
