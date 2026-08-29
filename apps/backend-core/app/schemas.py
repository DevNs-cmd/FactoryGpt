"""
Owner: Anuj
Pydantic request/response models with multi-tenant auth and factory configuration.
"""
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List


# ── Auth & Factory Schemas ────────────────────────────────────────

class FactoryLineIn(BaseModel):
    name: str
    machine_count: Optional[int] = 3
    target_per_shift: Optional[int] = 1000
    shifts: Optional[str] = "A,B,C"


class FactoryLineOut(BaseModel):
    id: int
    name: str
    machine_count: int
    target_per_shift: int
    shifts: str

    class Config:
        from_attributes = True


class FactoryOut(BaseModel):
    id: int
    name: str
    code: str
    location: Optional[str] = None
    industry: str
    lines: List[FactoryLineOut] = []

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    factory_id: Optional[int] = None
    factory_name: Optional[str] = None
    factory_code: Optional[str] = None
    is_approved: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class UserApprovalActionIn(BaseModel):
    user_id: int


class UserRegisterIn(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "operator"  # owner | manager | qc_inspector | maintenance_engineer | operator
    # If role == "owner" (creating new factory):
    factory_name: Optional[str] = None
    factory_location: Optional[str] = None
    industry: Optional[str] = "general"
    lines: Optional[List[FactoryLineIn]] = None
    # If role != "owner" (joining existing factory via code):
    factory_code: Optional[str] = None


class UserLoginIn(BaseModel):
    email: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    factory: Optional[FactoryOut] = None


class FactorySetupIn(BaseModel):
    name: str
    location: Optional[str] = None
    industry: Optional[str] = "general"
    lines: Optional[List[FactoryLineIn]] = None


# ── Production & Operational Schemas ──────────────────────────────

class ProductionEventOut(BaseModel):
    id: Optional[int] = None
    factory_id: Optional[int] = None
    line_id: str
    count: int
    target: int
    shift: str
    timestamp: datetime

    class Config:
        from_attributes = True


class DowntimeEventOut(BaseModel):
    id: Optional[int] = None
    factory_id: Optional[int] = None
    line_id: str
    machine_id: str
    duration_seconds: int
    reason: str
    timestamp: datetime

    class Config:
        from_attributes = True


class ManualProductionLogIn(BaseModel):
    line_id: str
    count: int
    target: int
    shift: str = "A"


class ManualDowntimeLogIn(BaseModel):
    line_id: str
    machine_id: str
    duration_seconds: int
    reason: str


class DefectEventIn(BaseModel):
    source_module: str          # "vision" | "maintenance" | "safety"
    defect_type: Optional[str] = None
    confidence: Optional[float] = None
    image_ref: Optional[str] = None
    description: Optional[str] = None
    factory_id: Optional[int] = None


class MachineHealthAlertIn(BaseModel):
    machine_id: str
    health_score: int
    threshold: Optional[int] = 40
    description: Optional[str] = None
    factory_id: Optional[int] = None


class TicketOut(BaseModel):
    id: int
    factory_id: Optional[int] = None
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
