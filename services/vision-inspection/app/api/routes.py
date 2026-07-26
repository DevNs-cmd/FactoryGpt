"""Owner: Krrish."""
import os
import httpx
from fastapi import APIRouter, UploadFile, File
from app.model.inference import run_inference
from app.schemas import InspectionResult

router = APIRouter()

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", 0.5))


@router.post("/inspect", response_model=InspectionResult)
async def inspect(file: UploadFile = File(...)):
    image_bytes = await file.read()
    defects = run_inference(image_bytes)

    # auto-trigger the workflow chain for anything above threshold
    for d in defects:
        if d["confidence"] >= CONFIDENCE_THRESHOLD:
            try:
                httpx.post(
                    f"{BACKEND_CORE_URL}/workflow/defect-event",
                    json={
                        "source_module": "vision",
                        "defect_type": d["defect_type"],
                        "confidence": d["confidence"],
                        "image_ref": file.filename,
                        "description": f"{d['defect_type']} detected ({d['confidence']:.2f} confidence)",
                    },
                    timeout=3.0,
                )
            except httpx.HTTPError:
                pass  # backend-core being down must not break inspection itself

    return {"image_ref": file.filename, "defects": defects}
