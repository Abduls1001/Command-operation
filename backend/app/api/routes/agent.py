
"""Phase 14: POST /api/agent/investigate — the AI agent answers a business question."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, field_validator

from app.agent import service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["agent"])


class InvestigateRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def _not_empty(cls, v: str) -> str:
        v = v.strip()

        if not v:
            raise ValueError("question must not be empty")

        if len(v) > 1000:
            raise ValueError("question must be at most 1000 characters")

        return v


class InvestigateResponse(BaseModel):
    question: str
    answer: str
    tools_used: list[str]


@router.post("/investigate", response_model=InvestigateResponse)
def investigate(body: InvestigateRequest):
    try:
        return service.investigate(body.question)

    except service.AgentConfigError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

    except service.AgentLLMError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    except Exception:
        logger.exception(
            "Unexpected error during agent investigation"
        )

        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred during investigation.",
        ) from None
