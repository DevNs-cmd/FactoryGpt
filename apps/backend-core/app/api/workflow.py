"""
Owner: Anuj
Workflow integration endpoints with dynamic multi-floor plant equipment discovery,
stateful predictive maintenance telemetry, and automated ticket/chatbot routing.
"""
import os
import time
import random
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, distinct
import httpx

from app.db.database import get_db
from app.db.models import DefectRecord, Ticket, Factory, FactoryLine, User, ProductionEvent, DowntimeEvent
from app.schemas import DefectEventIn, TicketOut, MachineHealthAlertIn
from app.auth.security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/workflow", tags=["workflow"])

CHATBOT_SERVICE_URL = os.getenv("CHATBOT_SERVICE_URL", "http://127.0.0.1:8002")
MAINTENANCE_SERVICE_URL = os.getenv("MAINTENANCE_SERVICE_URL", "http://127.0.0.1:8003")

# Persistent telemetry state per machine across poll cycles
_machine_telemetry_state = {}


def _resolve_factory_id(user: Optional[User], explicit_id: Optional[int], db: Session) -> Optional[int]:
    if explicit_id:
        return explicit_id
    if user and user.factory_id:
        return user.factory_id
    first_f = db.query(Factory).first()
    return first_f.id if first_f else 1


@router.post("/defect-event", response_model=TicketOut)
def defect_event(
    event: DefectEventIn,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Krrish's vision service calls this when YOLO detects a defect above threshold.
    Logs DefectRecord, opens a Ticket, and dispatches an alert to Gauri's chatbot.
    """
    factory_id = _resolve_factory_id(user, event.factory_id, db)
    try:
        if event.defect_type:
            record = DefectRecord(
                factory_id=factory_id,
                defect_type=event.defect_type,
                confidence=event.confidence or 0.85,
                image_ref=event.image_ref,
            )
            db.add(record)

        description = event.description or f"Automated defect alert: {event.defect_type or 'anomaly'} detected"
        ticket = Ticket(
            factory_id=factory_id,
            source_module=event.source_module or "vision",
            type="defect",
            status="open",
            description=description,
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error processing defect event")

    try:
        httpx.post(
            f"{CHATBOT_SERVICE_URL}/notify",
            json={"ticket_id": ticket.id, "description": ticket.description, "factory_id": factory_id},
            timeout=3.0,
        )
    except Exception:
        pass

    return ticket


@router.post("/machine-alert", response_model=TicketOut)
def machine_alert(
    alert: MachineHealthAlertIn,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Neerav's predictive-maintenance calls this when a machine drops below threshold.
    Opens a maintenance ticket and fires a chatbot alert.
    """
    factory_id = _resolve_factory_id(user, alert.factory_id, db)
    description = alert.description or (
        f"Machine health alert: {alert.machine_id} score at {alert.health_score}% "
        f"(predicted failure in {alert.predicted_days_to_failure} days)"
    )

    try:
        ticket = Ticket(
            factory_id=factory_id,
            source_module="maintenance",
            type="machine_health",
            status="open",
            description=description,
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error creating machine alert")

    try:
        httpx.post(
            f"{CHATBOT_SERVICE_URL}/notify",
            json={"ticket_id": ticket.id, "description": ticket.description, "factory_id": factory_id},
            timeout=3.0,
        )
    except Exception:
        pass

    return ticket


@router.get("/tickets", response_model=List[TicketOut])
def get_tickets(
    source_module: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    factory_id = _resolve_factory_id(user, None, db)
    query = db.query(Ticket)
    if factory_id:
        query = query.filter(Ticket.factory_id == factory_id)
    if source_module:
        query = query.filter(Ticket.source_module == source_module)
    if status:
        query = query.filter(Ticket.status == status)
    return query.order_by(desc(Ticket.created_at)).limit(limit).all()


@router.patch("/tickets/{ticket_id}/status", response_model=TicketOut)
def update_ticket_status(
    ticket_id: int,
    status: str,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if user and user.factory_id and ticket.factory_id and ticket.factory_id != user.factory_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this factory's tickets")

    ticket.status = status
    db.commit()
    db.refresh(ticket)
    return ticket


def _discover_factory_machines(factory_id: Optional[int], db: Session) -> List[str]:
    """
    Dynamically discovers all physical machine identifiers for a factory based on:
    1. Configured lines in FactoryLine
    2. Any imported lines in ProductionEvent (e.g. Floor-1-PressShop, Floor-2-Welding)
    3. Any logged machines in DowntimeEvent
    """
    machine_set = set()

    # 1. Configured lines in DB
    if factory_id:
        lines = db.query(FactoryLine).filter(FactoryLine.factory_id == factory_id).all()
        for l in lines:
            count = max(1, min(l.machine_count or 3, 5))
            for i in range(1, count + 1):
                machine_set.add(f"{l.name}-M{i}")

        # 2. Production events (imported multi-floor CSVs)
        prod_lines = db.query(distinct(ProductionEvent.line_id)).filter(ProductionEvent.factory_id == factory_id).all()
        for (pl,) in prod_lines:
            if pl:
                for i in range(1, 4):
                    machine_set.add(f"{pl}-M{i}")

        # 3. Downtime machines
        dt_machines = db.query(distinct(DowntimeEvent.machine_id)).filter(DowntimeEvent.factory_id == factory_id).all()
        for (dm,) in dt_machines:
            if dm:
                machine_set.add(dm)

    if not machine_set:
        # Default plant baseline
        machine_set = {"Line-1-M1", "Line-1-M2", "Line-1-M3", "Line-2-M1", "Line-2-M2", "Line-3-M1"}

    # Return clean sorted list (limit to 60 for high performance)
    return sorted(list(machine_set))[:60]


def _generate_dynamic_telemetry(factory_id: Optional[int], db: Session) -> list:
    global _machine_telemetry_state
    machine_ids = _discover_factory_machines(factory_id, db)
    machines_list = []

    for idx, m_id in enumerate(machine_ids):
        if m_id not in _machine_telemetry_state:
            # By default: only 1 or 2 specific machines have a simulated degradation scenario (e.g. machine containing 'M2')
            # and only if specifically flagged, otherwise realistic healthy operational baseline.
            is_anomaly = (idx == 1 or "Line-1-M2" in m_id or "Floor-2-RoboticWeld-Line1-M2" in m_id)
            _machine_telemetry_state[m_id] = {
                "vibration": 3.25 if is_anomaly else round(random.uniform(2.05, 2.35), 2),
                "temperature": 66.0 if is_anomaly else round(random.uniform(52.0, 56.0), 1),
                "rpm": 1470 if is_anomaly else random.randint(1495, 1515),
                "degrading": is_anomaly,
                "health_score": 58 if is_anomaly else random.randint(92, 99),
            }

        st = _machine_telemetry_state[m_id]

        if st.get("degrading", False):
            # Smooth, realistic gentle drift (+0.02 - +0.05 vib per tick)
            st["vibration"] = min(7.2, round(st["vibration"] + random.uniform(0.02, 0.05), 2))
            st["temperature"] = min(96.0, round(st["temperature"] + random.uniform(0.15, 0.4), 1))
            st["rpm"] = max(1360, st["rpm"] - random.randint(0, 2))
        else:
            # Stable healthy equipment with minor natural variance
            st["vibration"] = round(2.18 + random.uniform(-0.08, 0.08), 2)
            st["temperature"] = round(54.0 + random.uniform(-0.6, 0.6), 1)
            st["rpm"] = random.randint(1492, 1512)

        # Scientific Health Score Formula: Penalize vibration > 3.5 mm/s and temp > 70 C
        vib_penalty = max(0.0, (st["vibration"] - 3.5)) * 18.0
        temp_penalty = max(0.0, (st["temperature"] - 70.0)) * 2.2
        health_score = max(5, min(100, round(100.0 - vib_penalty - temp_penalty)))
        st["health_score"] = health_score

        if health_score >= 80:
            days_to_failure = 60
        elif health_score >= 60:
            days_to_failure = 30
        elif health_score >= 40:
            days_to_failure = 12
        else:
            days_to_failure = 2

        machines_list.append({
            "machine_id": m_id,
            "health_score": health_score,
            "vibration": st["vibration"],
            "temperature": st["temperature"],
            "rpm": st["rpm"],
            "degrading": st.get("degrading", False),
            "predicted_days_to_failure": days_to_failure,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        })

    return machines_list


@router.get("/check-machine-health")
def check_machine_health(
    threshold: int = 40,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Evaluates dynamic machine health for all discovered equipment in the user's factory.
    Creates workflow tickets and fires alerts when health score crosses critical threshold.
    """
    factory_id = _resolve_factory_id(user, None, db)
    machines = _generate_dynamic_telemetry(factory_id, db)

    alerts_created = []
    for item in machines:
        machine_id = item.get("machine_id")
        health_score = item.get("health_score", 100)

        if health_score < threshold:
            existing_query = db.query(Ticket).filter(
                Ticket.source_module == "maintenance",
                Ticket.description.contains(machine_id),
                Ticket.status == "open",
            )
            if factory_id:
                existing_query = existing_query.filter(Ticket.factory_id == factory_id)

            if not existing_query.first():
                try:
                    ticket = Ticket(
                        factory_id=factory_id,
                        source_module="maintenance",
                        type="machine_health",
                        status="open",
                        description=(
                            f"Critical Telemetry Alert: {machine_id} health score dropped to {health_score}% "
                            f"(Vibration: {item.get('vibration')} mm/s, Temp: {item.get('temperature')}°C). "
                            f"Predicted failure horizon: {item.get('predicted_days_to_failure')} days."
                        ),
                    )
                    db.add(ticket)
                    db.commit()
                    db.refresh(ticket)
                    alerts_created.append(ticket.id)
                except Exception:
                    db.rollback()

    degraded_count = sum(1 for m in machines if m["health_score"] < 70)

    return {
        "status": "ok",
        "threshold": threshold,
        "factory_id": factory_id,
        "machines_checked": len(machines),
        "degraded_machines_count": degraded_count,
        "alerts_created": alerts_created,
        "machines": machines,
    }


@router.post("/toggle-machine-anomaly")
def toggle_machine_anomaly(
    machine_id: str,
    degrading: bool = True,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Allows user to trigger or stop a simulated degradation anomaly on any specific machine on demand."""
    global _machine_telemetry_state
    if machine_id in _machine_telemetry_state:
        _machine_telemetry_state[machine_id]["degrading"] = degrading
        if not degrading:
            _machine_telemetry_state[machine_id]["vibration"] = 2.18
            _machine_telemetry_state[machine_id]["temperature"] = 54.0
            _machine_telemetry_state[machine_id]["health_score"] = 98
    else:
        _machine_telemetry_state[machine_id] = {
            "vibration": 3.4 if degrading else 2.18,
            "temperature": 68.0 if degrading else 54.0,
            "rpm": 1470 if degrading else 1505,
            "degrading": degrading,
            "health_score": 60 if degrading else 98,
        }

    return {
        "status": "ok",
        "machine_id": machine_id,
        "degrading": degrading,
        "message": f"Anomaly simulation {'activated' if degrading else 'deactivated'} for {machine_id}",
    }


@router.post("/reset-machine-health")
def reset_machine_health():
    """Resets all machines back to 100% healthy baseline."""
    global _machine_telemetry_state
    _machine_telemetry_state.clear()
    return {"status": "ok", "message": "All machine telemetry reset to healthy baseline."}
