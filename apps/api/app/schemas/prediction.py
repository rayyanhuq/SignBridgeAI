"""Pydantic request/response schemas for the /predict endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

LANDMARK_FRAME_LENGTH = 63  # 21 MediaPipe landmarks x (x, y, z)


class PredictRequest(BaseModel):
    """
    Always a sequence of landmark frames, even though Stage 1 only ever
    sends one — this keeps the request shape stable across the upgrade
    to continuous sequence recognition in Stage 2.
    """

    landmarks: list[list[float]] = Field(..., min_length=1)

    @field_validator("landmarks")
    @classmethod
    def validate_frame_length(cls, frames: list[list[float]]) -> list[list[float]]:
        for i, frame in enumerate(frames):
            if len(frame) != LANDMARK_FRAME_LENGTH:
                raise ValueError(
                    f"Frame {i} has {len(frame)} values; expected exactly "
                    f"{LANDMARK_FRAME_LENGTH} (21 landmarks x x,y,z)."
                )
        return frames


class PredictionResponse(BaseModel):
    label: str
    confidence: float
    unit: str
    model_version: str
    timestamp: str