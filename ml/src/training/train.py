"""
Train the Stage 1 static ASL alphabet classifier.

Loads the extracted landmark dataset (ml/data/processed/landmarks.npz),
trains a small feed-forward MLP, evaluates it on a held-out test set,
and saves the trained model plus preprocessing artifacts needed for
reproducible inference.

Usage:
    python -m src.training.train
"""

from __future__ import annotations

import json
import logging
from pathlib import Path

import joblib
import numpy as np
import tensorflow as tf
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.utils.class_weight import compute_class_weight

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

ML_ROOT = Path(__file__).resolve().parents[2]  # ml/
LANDMARKS_FILE = ML_ROOT / "data" / "processed" / "landmarks.npz"
ARTIFACTS_DIR = ML_ROOT / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "asl-alphabet-mlp-v1.keras"
SCALER_PATH = ARTIFACTS_DIR / "scaler.joblib"
LABELS_PATH = ARTIFACTS_DIR / "label_classes.json"

RANDOM_SEED = 42
TEST_SIZE = 0.2
VALIDATION_SPLIT = 0.1  # carved from the training set during model.fit
MAX_EPOCHS = 100
BATCH_SIZE = 32
EARLY_STOPPING_PATIENCE = 10


def load_dataset() -> tuple[np.ndarray, np.ndarray]:
    if not LANDMARKS_FILE.exists():
        raise FileNotFoundError(
            f"{LANDMARKS_FILE} not found. Run the full extraction "
            "(python -m src.capture.extract_landmarks) before training."
        )
    data = np.load(LANDMARKS_FILE)
    X, y_raw = data["features"], data["labels"]
    logger.info("Loaded dataset: X=%s, y=%s", X.shape, y_raw.shape)
    return X, y_raw


def build_model(num_classes: int) -> tf.keras.Model:
    model = tf.keras.Sequential(
        [
            tf.keras.Input(shape=(63,)),
            tf.keras.layers.Dense(128, activation="relu"),
            tf.keras.layers.Dense(64, activation="relu"),
            tf.keras.layers.Dense(num_classes, activation="softmax"),
        ]
    )
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def report_top_confusions(
    y_true: np.ndarray, y_pred: np.ndarray, class_names: list[str], top_n: int = 8
) -> None:
    """Log the most-confused letter pairs — useful for spotting patterns
    like M/N/W without needing a plotting library."""
    cm = confusion_matrix(y_true, y_pred)
    confusions = []
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            if i != j and cm[i, j] > 0:
                confusions.append((cm[i, j], class_names[i], class_names[j]))
    confusions.sort(reverse=True)

    logger.info("Top confused pairs (true -> predicted, count):")
    for count, true_label, pred_label in confusions[:top_n]:
        logger.info("  %s -> %s: %d", true_label, pred_label, count)


def main() -> None:
    np.random.seed(RANDOM_SEED)
    tf.random.set_seed(RANDOM_SEED)

    X, y_raw = load_dataset()

    # Label encoding maps letter strings to integer class indices.
    # Fitting this on the full label set before splitting is safe — it only
    # learns the symbol-to-index mapping, not any statistic of the feature
    # data, so it doesn't leak information between train and test.
    label_encoder = LabelEncoder()
    y = label_encoder.fit_transform(y_raw)
    class_names = list(label_encoder.classes_)
    logger.info("Classes (%d): %s", len(class_names), class_names)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y
    )
    logger.info("Train: %s, Test: %s", X_train.shape, X_test.shape)

    # Feature scaling is fit ONLY on the training set to avoid data leakage,
    # then applied to both train and test with the same fitted scaler.
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Mild class imbalance (~2.25:1 max/min) — class_weight is sufficient,
    # no duplication or resampling needed. Computed from real training data,
    # not assumed.
    class_weight_values = compute_class_weight(
        class_weight="balanced", classes=np.unique(y_train), y=y_train
    )
    class_weight_dict = dict(zip(np.unique(y_train), class_weight_values))
    logger.info("Class weights: %s", {
        class_names[k]: round(v, 3) for k, v in class_weight_dict.items()
    })

    model = build_model(num_classes=len(class_names))
    model.summary(print_fn=logger.info)

    early_stopping = tf.keras.callbacks.EarlyStopping(
        monitor="val_loss",
        patience=EARLY_STOPPING_PATIENCE,
        restore_best_weights=True,
    )

    history = model.fit(
        X_train_scaled,
        y_train,
        validation_split=VALIDATION_SPLIT,
        epochs=MAX_EPOCHS,
        batch_size=BATCH_SIZE,
        class_weight=class_weight_dict,
        callbacks=[early_stopping],
        verbose=2,
    )
    logger.info("Training stopped after %d epochs.", len(history.history["loss"]))

    # Final evaluation — held-out test set the model has never seen.
    test_loss, test_accuracy = model.evaluate(X_test_scaled, y_test, verbose=0)
    logger.info("Test loss: %.4f", test_loss)
    logger.info("Test accuracy: %.4f", test_accuracy)

    y_pred = np.argmax(model.predict(X_test_scaled, verbose=0), axis=1)
    logger.info(
        "\n%s", classification_report(y_test, y_pred, target_names=class_names)
    )
    report_top_confusions(y_test, y_pred, class_names)

    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    model.save(MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    with open(LABELS_PATH, "w") as f:
        json.dump(class_names, f, indent=2)

    logger.info("Saved model to %s", MODEL_PATH)
    logger.info("Saved scaler to %s", SCALER_PATH)
    logger.info("Saved label classes to %s", LABELS_PATH)


if __name__ == "__main__":
    main()