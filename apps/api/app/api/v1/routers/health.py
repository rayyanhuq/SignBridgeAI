"""Liveness health check."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def get_health() -> dict[str, str]:
    """
    Basic liveness check — confirms the process is up and responding.
    Readiness (DB connectivity, model loaded) is a Stage 3 concern per
    the architecture doc and isn't needed yet.
    """
    return {"status": "ok"}