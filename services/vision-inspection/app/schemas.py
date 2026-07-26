"""Owner: Krrish. Must match DefectDetection in docs/api-contracts.md."""
from pydantic import BaseModel
from typing import List


class Defect(BaseModel):
    defect_type: str          # crack | scratch | dent | missing_component | ok
    confidence: float
    bbox: List[float]         # [x1, y1, x2, y2]


class InspectionResult(BaseModel):
    image_ref: str
    defects: List[Defect]
