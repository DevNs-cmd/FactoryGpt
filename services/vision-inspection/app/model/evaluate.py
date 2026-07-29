"""
Owner: Krrish
Evaluates a trained model against the held-out TEST split (the 10% in
your 70/20/10 split) and saves the metrics to a JSON file for your
demo/report.

Usage:
    python app/model/evaluate.py --weights app/model/weights/best.pt --data data/prepared/data.yaml
"""
import argparse
import json
import logging
import sys
from pathlib import Path

from ultralytics import YOLO
from app.utils.device import get_device

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Same anchoring as train.py — see the comment there for why this matters.
SERVICE_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROJECT = SERVICE_ROOT / "runs" / "detect"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, help="path to a trained .pt file")
    parser.add_argument("--data", required=True, help="path to data.yaml (must have a 'test' key)")
    parser.add_argument("--device", default="auto", choices=["auto", "mps", "cpu"])
    parser.add_argument("--out", default="test_metrics.json", help="where to save the metrics summary")
    parser.add_argument("--project", default=str(DEFAULT_PROJECT), help="override where runs/ gets written")
    args = parser.parse_args()

    weights_path = Path(args.weights)
    if not weights_path.exists():
        logger.error(f"weights not found at {weights_path} — run train.py first")
        sys.exit(1)

    device = get_device(args.device)
    model = YOLO(str(weights_path))
    metrics = model.val(data=args.data, split="test", plots=True, device=device, project=args.project)

    summary = {
        "map50": float(metrics.box.map50),
        "map50_95": float(metrics.box.map),
        "precision": float(metrics.box.mp),
        "recall": float(metrics.box.mr),
    }
    Path(args.out).write_text(json.dumps(summary, indent=2))

    logger.info("--- Test set results (held-out 10%) ---")
    for name, value in summary.items():
        logger.info(f"{name:12s}: {value:.4f}")
    logger.info(f"Saved metrics -> {args.out}")
    logger.info("Confusion matrix + PR-curve plots saved under runs/detect/val*/ — good for your demo/report.")


if __name__ == "__main__":
    main()
