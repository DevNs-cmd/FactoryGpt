"""
Owner: Krrish
Fine-tunes a YOLO model on your prepared 70/20/10 split (see
scripts/prepare_dataset.py). Run app/model/evaluate.py afterward against
the held-out 10% test split — this script only trains + validates.

Usage:
    python app/model/train.py --data data/prepared/data.yaml --epochs 50
"""
import argparse
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="path to data.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640, help="lower this (e.g. 416) for faster CPU/MPS training")
    parser.add_argument("--base-model", default="yolov8n.pt", help="pretrained checkpoint to fine-tune from")
    args = parser.parse_args()

    model = YOLO(args.base_model)
    model.train(data=args.data, epochs=args.epochs, imgsz=args.imgsz)
    # Best weights land at runs/detect/train/weights/best.pt — copy them into
    # app/model/weights/best.pt when you're happy with the result:
    #   cp runs/detect/train/weights/best.pt app/model/weights/best.pt


if __name__ == "__main__":
    main()
