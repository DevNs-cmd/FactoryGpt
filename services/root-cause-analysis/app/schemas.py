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
class InventoryItem(BaseModel):
    item: str
    quantity: int
    reorder_threshold: int
    needs_reorder: bool


class InventorySummary(BaseModel):
    total_items: int
    items_to_reorder: int
    healthy_items: int


class RestockRequest(BaseModel):
    item: str
    quantity_added: int


class InventoryHistoryRecord(BaseModel):
    item: str
    quantity: int
    action: str