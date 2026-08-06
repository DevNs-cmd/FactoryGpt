"""
Owner: Krrish
Fine-tunes a YOLO model on your prepared 70/20/10 split. Defaults tuned
for a MacBook Air M2, 16GB unified memory — see --help for every knob.

Usage:
    python app/model/train.py --data data/prepared/data.yaml --epochs 50

    # force CPU if you suspect the MPS loss bug, or if MPS is slower for you:
    python app/model/train.py --data data/prepared/data.yaml --device cpu
"""
import argparse
import logging
import sys
from pathlib import Path

from ultralytics import YOLO
from app.utils.device import get_device

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Anchored to services/vision-inspection/ regardless of cwd. Ultralytics
# otherwise caches an absolute runs_dir in a GLOBAL settings file the
# first time it's ever run on your machine, and reuses it forever after —
# independent of which directory you're in on later runs. Passing
# `project=` explicitly overrides that cache every time.
SERVICE_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROJECT = SERVICE_ROOT / "runs" / "detect"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640, help="drop to 416 for meaningfully faster training, some accuracy cost")
    parser.add_argument("--batch", type=int, default=16, help="16 is a safe starting point for 16GB unified memory at imgsz=640; drop to 8 if the machine struggles")
    parser.add_argument("--workers", type=int, default=4, help="dataloader workers — keep modest on macOS; set 0 if you hit multiprocessing errors")
    parser.add_argument("--patience", type=int, default=15, help="stop early if val loss hasn't improved in N epochs — saves time on a laptop")
    parser.add_argument("--device", default="auto", choices=["auto", "mps", "cpu"])
    parser.add_argument("--base-model", default="yolov8n.pt", help="nano — the right size for a laptop, not a workstation GPU")
    parser.add_argument("--seed", type=int, default=42, help="fixed seed for reproducible splits/init")
    parser.add_argument("--resume", action="store_true", help="resume the last interrupted run instead of starting fresh")
    parser.add_argument("--project", default=str(DEFAULT_PROJECT), help="override where runs/ gets written")
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        logger.error(f"data.yaml not found at {data_path} — run scripts/prepare_dataset.py first")
        sys.exit(1)

    device = get_device(args.device)
    logger.info(
        f"Training {args.base_model} | device={device} | batch={args.batch} | "
        f"imgsz={args.imgsz} | epochs={args.epochs} | patience={args.patience} | "
        f"project={args.project}"
    )

    model = YOLO(args.base_model)
    try:
        results = model.train(
            data=str(data_path),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            workers=args.workers,
            patience=args.patience,
            device=device,
            seed=args.seed,
            resume=args.resume,
            project=args.project,
        )
    except KeyboardInterrupt:
        logger.warning("Interrupted — partial checkpoint saved under runs/detect/train*/weights/last.pt (use --resume to continue)")
        sys.exit(130)
    except RuntimeError as e:
        logger.error(f"Training failed: {e}")
        if device == "mps":
            logger.error("If this is a memory error, retry with a smaller --batch (e.g. 8) or --imgsz (e.g. 416).")
        sys.exit(1)

    best_path = Path(results.save_dir) / "weights" / "best.pt"
    logger.info(f"Training complete. Best weights: {best_path}")

    if device == "mps":
        logger.warning(
            "Trained on MPS — before trusting these weights, scroll up through the "
            "epoch log and confirm box_loss is NOT stuck at exactly 0.0 the whole "
            "run. That's a known MPS bug on some torch/ultralytics versions. If you "
            "see it, rerun with --device cpu."
        )


if __name__ == "__main__":
    main()
