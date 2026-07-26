"""
Owner: Krrish
Evaluates a trained model against the held-out TEST split (the 10% in
your 70/20/10 split) — this is what "testing the model" means for object
detection: standard precision/recall/mAP metrics on data the model never
saw during training or validation.

Usage:
    python app/model/evaluate.py --weights app/model/weights/best.pt --data data/prepared/data.yaml
"""
import argparse
from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--weights", required=True, help="path to a trained .pt file")
    parser.add_argument("--data", required=True, help="path to data.yaml (must have a 'test' key)")
    args = parser.parse_args()

    model = YOLO(args.weights)
    metrics = model.val(data=args.data, split="test", plots=True)

    print("\n--- Test set results (held-out 10%) ---")
    print(f"mAP50:     {metrics.box.map50:.4f}   (higher is better, 1.0 = perfect)")
    print(f"mAP50-95:  {metrics.box.map:.4f}")
    print(f"Precision: {metrics.box.mp:.4f}")
    print(f"Recall:    {metrics.box.mr:.4f}")
    print("\nConfusion matrix + PR-curve plots saved under runs/detect/val*/ "
          "— good to screenshot for your demo/report.")


if __name__ == "__main__":
    main()
