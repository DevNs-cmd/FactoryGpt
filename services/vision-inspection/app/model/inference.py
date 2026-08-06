"""
Owner: Krrish
Loads the trained YOLO weights and runs detection. Class names come
straight from the trained model (model.names) rather than a hardcoded
list, so this file never needs editing when you switch datasets.

Falls back to a small dummy detector ONLY when no weights file exists yet
— this keeps the rest of the team (Anuj/Abhi) unblocked, since trained
weights are gitignored and won't exist on their machines. Once you drop
in app/model/weights/best.pt, this switches to real detections
automatically, no code change needed.
"""
import os
import random
from io import BytesIO
from PIL import Image

MODEL_WEIGHTS_PATH = os.getenv("MODEL_WEIGHTS_PATH", "app/model/weights/best.pt")

_model = None
_DUMMY_CLASSES = ["defect_a", "defect_b"]  # arbitrary — only used for fake placeholder output


def _weights_exist():
    return os.path.exists(MODEL_WEIGHTS_PATH)


def _load_model():
    global _model
    if _model is None and _weights_exist():
        from ultralytics import YOLO
        _model = YOLO(MODEL_WEIGHTS_PATH)
    return _model


def run_inference(image_bytes: bytes):
    """Returns a list of dicts: defect_type, confidence, bbox."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = image.size

    if not _weights_exist():
        print(f"[vision-inspection] WARNING: no weights at {MODEL_WEIGHTS_PATH} — returning dummy output")
        if random.random() < 0.3:
            return []
        return [{
            "defect_type": random.choice(_DUMMY_CLASSES),
            "confidence": round(random.uniform(0.55, 0.97), 2),
            "bbox": [width * 0.2, height * 0.2, width * 0.5, height * 0.5],
        }]

    model = _load_model()
    results = model.predict(image, verbose=False)[0]
    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        detections.append({
            "defect_type": model.names.get(cls_id, f"class_{cls_id}"),
            "confidence": round(float(box.conf[0]), 2),
            "bbox": [float(x) for x in box.xyxy[0].tolist()],
        })
    return detections
