"""
Owner: Krrish
Fine-tuning script skeleton. Run this once you've picked a public defect
dataset (e.g. a casting-defect or PCB-defect dataset) and converted it to
YOLO format (images/ + labels/ + dataset.yaml).

Usage:
    python app/model/train.py --data path/to/dataset.yaml --epochs 50
"""
import argparse
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="path to dataset.yaml")
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--base-model", default="yolov8n.pt", help="pretrained checkpoint to fine-tune from")
    args = parser.parse_args()

    model = YOLO(args.base_model)
    model.train(data=args.data, epochs=args.epochs, imgsz=640)
    # Copy the resulting best.pt into app/model/weights/best.pt when done:
    #   cp runs/detect/train/weights/best.pt app/model/weights/best.pt


if __name__ == "__main__":
    main()
