"""
Owner: Anuj
Pydantic request/response models — must match docs/api-contracts.md exactly.
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ProductionEventOut(BaseModel):
    line_id: str
    count: int
    target: int
    shift: str
    timestamp: datetime

    class Config:
        from_attributes = True


class DowntimeEventOut(BaseModel):
    line_id: str
    machine_id: str
    duration_seconds: int
    reason: str
    timestamp: datetime

    class Config:
        from_attributes = True


class DefectEventIn(BaseModel):
    source_module: str          # "vision" | "maintenance" | "safety"
    defect_type: Optional[str] = None
    confidence: Optional[float] = None
    image_ref: Optional[str] = None
    description: Optional[str] = None


class TicketOut(BaseModel):
    id: int
    source_module: str
    type: str
    status: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True


class ShiftSummary(BaseModel):
    shift: str
    count: int
    target: int
    efficiency_pct: float


class LineSummary(BaseModel):
    line_id: str
    count: int
    target: int
    efficiency_pct: float


class ProductionSummaryOut(BaseModel):
    total_count: int
    total_target: int
    overall_efficiency_pct: float
    by_shift: List[ShiftSummary]
    by_line: List[LineSummary]
