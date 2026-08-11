"""Owner: Neerav."""
import os
import httpx
from fastapi import APIRouter, HTTPException, Query
from app.data.synthetic_sensors import (
    read_all_sensors,
    read_sensor,
    get_history,
    MACHINES,
    DEGRADING_MACHINES,
)
from app.model.health_score import compute_health
from app.schemas import MachineHealth, MachineHealthHistory

router = APIRouter()

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
HEALTH_ALERT_THRESHOLD = int(os.getenv("HEALTH_ALERT_THRESHOLD", 40))
HEALTH_RECOVERY_THRESHOLD = int(os.getenv("HEALTH_RECOVERY_THRESHOLD", HEALTH_ALERT_THRESHOLD + 15))

# tracks whether a machine currently has an unresolved alert, so a ticket
# fires once on the way down and can fire again after the machine recovers
# past HEALTH_RECOVERY_THRESHOLD and later degrades a second time
_alert_active = {}


def _send_defect_alert(result: dict) -> None:
    try:
        httpx.post(
            f"{BACKEND_CORE_URL}/workflow/defect-event",
            json={
                "source_module": "maintenance",
                "defect_type": "machine_health",
                "description": f"{result['machine_id']} health score dropped to {result['health_score']}",
            },
            timeout=3.0,
        )
    except httpx.HTTPError:
        pass


def _maybe_alert(result: dict) -> None:
    machine_id, score = result["machine_id"], result["health_score"]
    active = _alert_active.get(machine_id, False)
    if not active and score < HEALTH_ALERT_THRESHOLD:
        _alert_active[machine_id] = True
        _send_defect_alert(result)
    elif active and score >= HEALTH_RECOVERY_THRESHOLD:
        _alert_active[machine_id] = False


@router.get("/machine-health", response_model=list[MachineHealth])
def machine_health():
    results = [compute_health(r) for r in read_all_sensors()]
    for result in results:
        _maybe_alert(result)
    return results


@router.get("/machine-health/{machine_id}", response_model=MachineHealth)
def machine_health_single(machine_id: str):
    if machine_id not in MACHINES:
        raise HTTPException(status_code=404, detail=f"unknown machine_id, expected one of {MACHINES}")
    return compute_health(read_sensor(machine_id))


@router.get("/machine-health/{machine_id}/history", response_model=MachineHealthHistory)
def machine_health_history(machine_id: str, limit: int = Query(50, ge=1, le=200)):
    if machine_id not in MACHINES:
        raise HTTPException(status_code=404, detail=f"unknown machine_id, expected one of {MACHINES}")
    readings = [compute_health(r) for r in get_history(machine_id, limit=limit)]
    return MachineHealthHistory(
        machine_id=machine_id,
        degrading=machine_id in DEGRADING_MACHINES,
        count=len(readings),
        readings=readings,
    )
