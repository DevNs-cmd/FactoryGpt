"""Owner: Vedant."""
from pydantic import BaseModel
from typing import List, Dict


class CauseBreakdown(BaseModel):
    reason: str
    count: int
    total_downtime_seconds: int


class RootCauseResponse(BaseModel):
    by_reason: List[CauseBreakdown]
    worst_machine: str | None
    worst_line: str | None


class ReportResponse(BaseModel):
    summary: str
    top_causes: List[str]
    total_downtime_events: int
