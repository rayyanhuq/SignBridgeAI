"""
Inference for the Stage 1 static ASL alphabet classifier.

Loads the trained MLP, its fitted scaler, and the label class list, and
exposes a single predict() method that takes a raw 63-value MediaPipe
landmark vector and returns a prediction shaped to match the project's
generic Prediction contract (label, confidence, unit, model_version,
timestamp) — the same shape the /predict API endpoint will return once
FastAPI integration happens in a later milestone.

This module has no FastAPI or web dependencies. It's a plain inference
class the backend's ml_bridge will call into later.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence

import joblib
import numpy as np
import tensorflow as tf

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

ML_ROOT = Path(__file__).resolve().parents[2]  # ml/
ARTIFACTS_DIR = ML_ROOT / "artifacts"
DEFAULT_MODEL_PATH = ARTIFACTS_DIR / "asl-alphabet-mlp-v1.keras"
DEFAULT_SCALER_PATH = ARTIFACTS_DIR / "scaler.joblib"
DEFAULT_LABELS_PATH = ARTIFACTS_DIR / "label_classes.json"

EXPECTED_FEATURE_COUNT = 63  # 21 landmarks x (x, y, z)


class ASLAlphabetPredictor:
    """Loads the trained Stage 1 model once and serves predictions.

    Model version is hardcoded to match the artifact filename convention —
    this becomes a registry lookup in a later stage, not now.
    """

    MODEL_VERSION = "asl-alphabet-mlp-v1"
    UNIT = "letter"

    def __init__(
        self,
        model_path: Path = DEFAULT_MODEL_PATH,
        scaler_path: Path = DEFAULT_SCALER_PATH,
        labels_path: Path = DEFAULT_LABELS_PATH,
    ) -> None:
        for path in (model_path, scaler_path, labels_path):
            if not path.exists():
                raise FileNotFoundError(
                    f"{path} not found. Run training (python -m src.training.train) first."
                )

        logger.info("Loading model from %s", model_path)
        self._model = tf.keras.models.load_model(model_path)

        logger.info("Loading scaler from %s", scaler_path)
        self._scaler = joblib.load(scaler_path)

        logger.info("Loading label classes from %s", labels_path)
        with open(labels_path) as f:
            self._class_names: list[str] = json.load(f)

        logger.info("Predictor ready. %d classes loaded.", len(self._class_names))

    def predict(self, landmark_vector: Sequence[float]) -> dict:
        """Predict a letter from a single 63-value landmark vector.

        Applies the exact same preprocessing as training: the vector is
        scaled using the SAME fitted scaler from train.py (never re-fit
        here — re-fitting on inference data would silently break the
        train/inference consistency the whole pipeline depends on).
        """
        vector = np.asarray(landmark_vector, dtype=np.float32)
        if vector.shape != (EXPECTED_FEATURE_COUNT,):
            raise ValueError(
                f"Expected a vector of {EXPECTED_FEATURE_COUNT} values "
                f"(21 landmarks x x,y,z), got shape {vector.shape}."
            )

        vector_scaled = self._scaler.transform(vector.reshape(1, -1))
        probabilities = self._model.predict(vector_scaled, verbose=0)[0]

        predicted_index = int(np.argmax(probabilities))
        label = self._class_names[predicted_index]
        confidence = float(probabilities[predicted_index])

        return {
            "label": label,
            "confidence": confidence,
            "unit": self.UNIT,
            "model_version": self.MODEL_VERSION,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


def _self_test() -> None:
    """Smoke test: load a handful of real samples from the processed
    dataset and confirm predictions come back correctly shaped. This is
    NOT a re-evaluation of accuracy (that already happened during
    training) — it only confirms the inference pipeline itself works
    end-to-end: artifacts load, preprocessing applies correctly, and
    labels decode to real letters.
    """
    landmarks_file = ML_ROOT / "data" / "processed" / "landmarks.npz"
    if not landmarks_file.exists():
        logger.warning("No landmarks.npz found — skipping self-test sample check.")
        return

    data = np.load(landmarks_file)
    X, y = data["features"], data["labels"]

    predictor = ASLAlphabetPredictor()

    rng = np.random.default_rng(seed=7)
    sample_indices = rng.choice(len(X), size=8, replace=False)

    logger.info("Running self-test on %d random samples:", len(sample_indices))
    correct = 0
    for idx in sample_indices:
        result = predictor.predict(X[idx])
        actual = y[idx]
        is_correct = result["label"] == actual
        correct += is_correct
        logger.info(
            "  actual=%s predicted=%s confidence=%.3f %s",
            actual,
            result["label"],
            result["confidence"],
            "OK" if is_correct else "MISMATCH",
        )

    logger.info("Self-test: %d/%d correct", correct, len(sample_indices))


if __name__ == "__main__":
    _self_test()