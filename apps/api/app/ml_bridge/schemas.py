"""
Framework-agnostic type aliases for the ml_bridge layer.

Deliberately has NO FastAPI or Pydantic imports. Keeping this layer
independent of the web framework is intentional, per the architecture's
design — ml_bridge should be testable and swappable without needing
FastAPI running at all.
"""

from typing import TypedDict

# A single MediaPipe landmark frame: 63 flat values (21 landmarks x x,y,z).
LandmarkFrame = list[float]


class Prediction(TypedDict):
    label: str
    confidence: float
    unit: str
    model_version: str
    timestamp: str