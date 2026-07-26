# vision-inspection — owner: Krrish (AI, Computer Vision, Automation)

## Why this folder is yours
This is the only service that needs a trained model, so it's isolated from
everyone else's code — you can train/experiment freely without touching
anyone else's files, and nobody else needs to understand your model
internals, only your `/inspect` API shape.

## What's already scaffolded for you
- `app/model/inference.py` — runs detection. **Ships in "dummy mode"**
  (random plausible detections) until `app/model/weights/best.pt` exists,
  so Anuj/Abhi can build against your API before your model is trained.
- `app/model/train.py` — fine-tuning skeleton using `ultralytics` (YOLO)
- `app/api/routes.py` — `POST /inspect`; on a confident detection it
  auto-calls backend-core's `/workflow/defect-event` (this is the
  "automation" part of your skillset)
- `app/utils/video_feed.py` — loops `data/sample_images/` to fake a live camera
- `app/schemas.py` — matches `DefectDetection` in `docs/api-contracts.md`

## Your actual to-do list
1. **Day 1-2**: Get the service running in dummy mode (steps below), confirm `POST /inspect` works with any test image.
2. **Day 2-3**: Pick a public defect dataset (casting defects, PCB defects, or NEU surface defects are all good, well-documented options) and convert it to YOLO format.
3. **Day 4-7**: Run `app/model/train.py`, iterate on epochs/augmentation until detection quality is demo-good — it doesn't need to be perfect, just convincingly right most of the time on your sample images.
4. **Day 7**: Copy your trained weights to `app/model/weights/best.pt` — this automatically switches the service out of dummy mode, no code change needed.
5. **Day 8**: Collect/curate `data/sample_images/` — 15-20 images that show your model detecting real defects convincingly, for the "live feed" demo.
6. **Day 9-10 (stretch)**: If time allows, add a second small model or reuse this one for Safety AI (helmet/PPE detection) — same pipeline, just a second `/inspect`-style endpoint.
7. **Ongoing**: Don't change the shape of `Defect`/`InspectionResult` in `schemas.py` without checking `docs/api-contracts.md` first — Anuj's `workflow.py` and the frontend both depend on those exact field names.

## Installation
```bash
cd services/vision-inspection
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8001
```
Test it without any real model:
```bash
curl -X POST http://localhost:8001/inspect -F "file=@data/sample_images/any_test_image.jpg"
```
