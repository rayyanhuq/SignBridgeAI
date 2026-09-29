"""Prediction endpoint — the Stage 1 core of SignBridge AI."""

import logging

from fastapi import APIRouter, HTTPException

from app.ml_bridge import inference_client
from app.schemas.prediction import PredictRequest, PredictionResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["prediction"])


@router.post("/predict", response_model=PredictionResponse)
def predict(request: PredictRequest) -> PredictionResponse:
    try:
        result = inference_client.predict(request.landmarks)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception:
        logger.exception("Prediction failed unexpectedly.")
        raise HTTPException(status_code=500, detail="Prediction failed.")

    return PredictionResponse(**result)