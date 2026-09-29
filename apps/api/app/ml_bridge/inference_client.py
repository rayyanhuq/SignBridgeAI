"""
Bridge between the FastAPI backend and the ml/ inference pipeline.

Loads the trained Stage 1 predictor once at import time and exposes a
single predict() function matching the project's unified inference
contract: predict(landmark_sequence) -> Prediction.

Stage 1's model only ever looks at one frame — it reads the last frame
in the sequence and ignores the rest. This is deliberate: it's what lets
Stage 2's sequence model use this exact same call signature later
without any change to this call site or the API layer above it.
"""

from __future__ import annotations

import logging
import sys
from pathlib import Path

from app.ml_bridge.schemas import LandmarkFrame, Prediction

logger = logging.getLogger(__name__)

# ml/ is a sibling project folder, not a pip-installed dependency of the
# API. Add it to sys.path once so its inference module can be imported
# directly, without duplicating any prediction logic in this file.
_ML_ROOT = Path(__file__).resolve().parents[4] / "ml"
if str(_ML_ROOT) not in sys.path:
    sys.path.insert(0, str(_ML_ROOT))

from src.inference.predictor import ASLAlphabetPredictor  # noqa: E402

logger.info("Loading Stage 1 ASL alphabet model...")
_predictor = ASLAlphabetPredictor()
logger.info("Model loaded and ready.")


def predict(landmark_sequence: list[LandmarkFrame]) -> Prediction:
    """
    Run inference on a sequence of landmark frames.

    Stage 1: uses only the last frame (the classifier is single-frame).
    Stage 2: the sequence model will consume the full sequence — this
    function's signature does not change when that happens.
    """
    if not landmark_sequence:
        raise ValueError("landmark_sequence must contain at least one frame.")

    current_frame = landmark_sequence[-1]
    return _predictor.predict(current_frame)  # type: ignore[return-value]