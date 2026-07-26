"""Owner: Neerav. Must match MachineHealth in docs/api-contracts.md."""
from pydantic import BaseModel
from datetime import datetime


class MachineHealth(BaseModel):
    machine_id: str
    health_score: int          # 0-100
    vibration: float
    temperature: float
    rpm: int
    predicted_days_to_failure: int
    timestamp: datetime
