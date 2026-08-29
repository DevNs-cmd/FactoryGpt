"""
Owner: Neerav
Predictive Maintenance REST API with Real-Time Health Computation and Anomaly Alerts.
"""
import os
import httpx
from fastapi import APIRouter
from app.data.synthetic_sensors import read_all_sensors, read_sensor, reset_sensor_simulation, MACHINES
from app.model.health_score import compute_health

router = APIRouter()

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
HEALTH_ALERT_THRESHOLD = int(os.getenv("HEALTH_ALERT_THRESHOLD", 40))

_last_alerted = set()


@router.get("/machine-health")
def machine_health():
    results = [compute_health(r) for r in read_all_sensors()]
    for result in results:
        if result["health_score"] < HEALTH_ALERT_THRESHOLD and result["machine_id"] not in _last_alerted:
            _last_alerted.add(result["machine_id"])
            try:
                httpx.post(
                    f"{BACKEND_CORE_URL}/workflow/defect-event",
                    json={
                        "source_module": "maintenance",
                        "defect_type": "machine_health",
                        "description": f"Critical degradation on {result['machine_id']}: health score {result['health_score']}/100 (Vibration {result['vibration']} mm/s, Temp {result['temperature']}°C)",
                    },
                    timeout=3.0,
                )
            except Exception:
                pass
    return results


@router.get("/machine-health/{machine_id}")
def machine_health_single(machine_id: str):
    if machine_id not in MACHINES:
        return {"error": f"unknown machine_id, expected one of {MACHINES}"}
    return compute_health(read_sensor(machine_id))


@router.post("/machine-health/reset")
def reset_health():
    global _last_alerted
    _last_alerted.clear()
    return reset_sensor_simulation()
