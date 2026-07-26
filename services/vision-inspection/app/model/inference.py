"""
Owner: Krrish
Loads the trained YOLO weights and runs detection. IMPORTANT: before you've
trained anything, this falls back to a dummy detector so the rest of the
team (backend, frontend) can build against your API on Day 1 without
waiting for your model to be ready. Swap DUMMY_MODE off once weights exist.
"""
import os
import random
from io import BytesIO
from PIL import Image

MODEL_WEIGHTS_PATH = os.getenv("MODEL_WEIGHTS_PATH", "app/model/weights/best.pt")
DEFECT_CLASSES = ["crack", "scratch", "dent", "missing_component"]

_model = None
DUMMY_MODE = not os.path.exists(MODEL_WEIGHTS_PATH)


def _load_model():
    global _model
    if _model is None and not DUMMY_MODE:
        from ultralytics import YOLO
        _model = YOLO(MODEL_WEIGHTS_PATH)
    return _model


def run_inference(image_bytes: bytes):
    """Returns a list of dicts: defect_type, confidence, bbox."""
    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    width, height = image.size

    if DUMMY_MODE:
        # Placeholder so downstream teammates aren't blocked on training.
        # TODO(Krrish): remove once app/model/weights/best.pt exists.
        if random.random() < 0.3:
            return []
        return [{
            "defect_type": random.choice(DEFECT_CLASSES),
            "confidence": round(random.uniform(0.55, 0.97), 2),
            "bbox": [width * 0.2, height * 0.2, width * 0.5, height * 0.5],
        }]

    model = _load_model()
    results = model.predict(image, verbose=False)[0]
    detections = []
    for box in results.boxes:
        cls_id = int(box.cls[0])
        detections.append({
            "defect_type": model.names.get(cls_id, "unknown"),
            "confidence": round(float(box.conf[0]), 2),
            "bbox": [float(x) for x in box.xyxy[0].tolist()],
        })
    return detections
