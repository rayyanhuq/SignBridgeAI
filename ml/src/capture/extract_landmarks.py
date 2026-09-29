"""
Extract MediaPipe hand landmarks from the ASL Alphabet dataset.

Reads static hand-shape images from:
    ml/data/raw/asl_alphabet_train/<LETTER>/*.jpg

Writes a single labeled landmark dataset to:
    ml/data/processed/landmarks.npz

Only static letters are processed (A-Y, excluding J and Z, which involve
motion and are out of scope for the Stage 1 single-frame classifier).

Usage:
    python -m src.capture.extract_landmarks
    python -m src.capture.extract_landmarks --max-per-class 200   # fast dev run
"""

from __future__ import annotations

import argparse
import logging
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Static ASL alphabet letters only. J and Z are excluded — see module docstring.
SUPPORTED_LETTERS = sorted(set("ABCDEFGHIJKLMNOPQRSTUVWXYZ") - {"J", "Z"})

ML_ROOT = Path(__file__).resolve().parents[2]  # ml/
DEFAULT_RAW_DIR = ML_ROOT / "data" / "raw" / "asl_alphabet_train"
DEFAULT_OUTPUT_FILE = ML_ROOT / "data" / "processed" / "landmarks.npz"


def extract_landmarks_from_image(hands: mp.solutions.hands.Hands, image_path: Path) -> np.ndarray | None:
    """Run MediaPipe Hands on a single image.

    Returns a flat 63-value landmark vector (21 points x,y,z), or None if
    the image couldn't be read or no hand was detected in it.
    """
    image = cv2.imread(str(image_path))
    if image is None:
        return None

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)

    if not results.multi_hand_landmarks:
        return None

    hand = results.multi_hand_landmarks[0]
    return np.array(
        [[lm.x, lm.y, lm.z] for lm in hand.landmark],
        dtype=np.float32,
    ).flatten()


def build_dataset(
    raw_dir: Path,
    max_per_class: int | None,
) -> tuple[np.ndarray, np.ndarray]:
    """Walk each letter folder, extract landmarks, and collect them into
    feature/label arrays. Images where no hand is detected are skipped and
    counted, not silently zero-filled."""
    features: list[np.ndarray] = []
    labels: list[str] = []
    skipped_total = 0

    with mp.solutions.hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5,
    ) as hands:
        for letter in SUPPORTED_LETTERS:
            letter_dir = raw_dir / letter
            if not letter_dir.exists():
                logger.warning("No folder found for letter '%s' — skipping.", letter)
                continue

            image_paths = sorted(letter_dir.glob("*.jpg"))
            if max_per_class is not None:
                image_paths = image_paths[:max_per_class]

            kept, skipped = 0, 0
            for image_path in image_paths:
                vector = extract_landmarks_from_image(hands, image_path)
                if vector is None:
                    skipped += 1
                    continue
                features.append(vector)
                labels.append(letter)
                kept += 1

            skipped_total += skipped
            logger.info("Letter %s: %d kept, %d skipped (no hand detected)", letter, kept, skipped)

    logger.info("Done. %d total samples, %d total skipped.", len(features), skipped_total)
    return np.array(features, dtype=np.float32), np.array(labels)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--raw-dir",
        type=Path,
        default=DEFAULT_RAW_DIR,
        help="Path to the asl_alphabet_train folder (default: ml/data/raw/asl_alphabet_train)",
    )
    parser.add_argument(
        "--max-per-class",
        type=int,
        default=None,
        help="Limit images processed per letter, for a fast dev run",
    )
    args = parser.parse_args()

    if not args.raw_dir.exists():
        raise FileNotFoundError(
            f"Dataset not found at {args.raw_dir}. "
            "Download the ASL Alphabet dataset and place it there first — see README."
        )

    features, labels = build_dataset(args.raw_dir, args.max_per_class)

    DEFAULT_OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    np.savez(DEFAULT_OUTPUT_FILE, features=features, labels=labels)
    logger.info("Saved processed dataset to %s", DEFAULT_OUTPUT_FILE)


if __name__ == "__main__":
    main()