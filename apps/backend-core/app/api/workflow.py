"""
Owner: Anuj
The Workflow Automation chain: defect/alert comes in -> logged -> Ticket
created -> Gauri's /notify called -> (mock) ERP log updated.
This is the single endpoint that proves the system is "one connected
factory OS" rather than 5 separate demos.
"""
import os
import httpx
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import DefectRecord, Ticket
from app.schemas import DefectEventIn, TicketOut, MachineHealthAlertIn

router = APIRouter(prefix="/workflow", tags=["workflow"])

CHATBOT_SERVICE_URL = os.getenv("CHATBOT_SERVICE_URL", "http://localhost:8002")
MAINTENANCE_SERVICE_URL = os.getenv("MAINTENANCE_SERVICE_URL", "http://localhost:8003")


@router.post("/defect-event", response_model=TicketOut)
def defect_event(event: DefectEventIn, db: Session = Depends(get_db)):
    try:
        # 1. log the raw defect/alert
        if event.defect_type:
            record = DefectRecord(
                defect_type=event.defect_type,
                confidence=event.confidence or 0.0,
                image_ref=event.image_ref,
            )
            db.add(record)

        # 2. open a ticket
        ticket = Ticket(
            source_module=event.source_module,
            type=event.defect_type or "alert",
            status="open",
            description=event.description or f"{event.source_module} triggered an event",
        )
        db.add(ticket)
        db.commit()
        db.refresh(ticket)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database transaction failed while creating ticket")

    # 3. fire the notification (best-effort — a dead chatbot service must
    # never crash this endpoint, it should just skip the notify step)
    try:
        httpx.post(
            f"{CHATBOT_SERVICE_URL}/notify",
            json={"ticket_id": ticket.id, "description": ticket.description},
            timeout=3.0,
        )
    except Exception:
        pass

    # 4. "update ERP" — stand-in for a real SAP/Oracle call for the demo
    print(f"[mock-erp] logged ticket #{ticket.id}: {ticket.description}")

    return ticket


@router.get("/tickets", response_model=List[TicketOut])
def get_tickets(
    source_module: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Fetch created workflow tickets/alerts with optional filtering by source_module and status."""
    query = db.query(Ticket)
    if source_module:
        query = query.filter(Ticket.source_module == source_module)
    if status:
        query = query.filter(Ticket.status == status)
    return query.order_by(desc(Ticket.created_at)).limit(limit).all()


@router.post("/machine-alert", response_model=TicketOut)
def machine_alert(alert: MachineHealthAlertIn, db: Session = Depends(get_db)):
    """Logs a machine health threshold breach alert, opens a ticket, triggers chatbot notification, and updates mock ERP."""
    description = alert.description or f"Machine {alert.machine_id} health score dropped to {alert.health_score} (below threshold {alert.threshold})"
    try:
        ticket = Ticket(
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
        raise HTTPException(status_code=500, detail="Database transaction failed while creating machine alert ticket")

    # Notify chatbot
    try:
        httpx.post(
            f"{CHATBOT_SERVICE_URL}/notify",
            json={"ticket_id": ticket.id, "description": ticket.description},
            timeout=3.0,
        )
    except Exception:
        pass

    print(f"[mock-erp] logged machine alert ticket #{ticket.id}: {ticket.description}")
    return ticket


@router.get("/check-machine-health")
def check_machine_health(threshold: int = 40, db: Session = Depends(get_db)):
    """
    Evaluates machine health from predictive-maintenance service against threshold.
    Creates workflow tickets and fires chatbot notifications for any degraded machines.
    """
    try:
        r = httpx.get(f"{MAINTENANCE_SERVICE_URL}/machine-health", timeout=3.0)
        r.raise_for_status()
        machines = r.json()
    except Exception:
        return {
            "status": "error",
            "message": f"Predictive maintenance service unreachable or offline on {MAINTENANCE_SERVICE_URL}",
            "alerts_created": []
        }

    alerts_created = []
    for item in machines:
        machine_id = item.get("machine_id")
        health_score = item.get("health_score", 100)

        if health_score < threshold:
            existing = (
                db.query(Ticket)
                .filter(
                    Ticket.source_module == "maintenance",
                    Ticket.description.contains(machine_id),
                    Ticket.status == "open",
                )
                .first()
            )

            if not existing:
                desc = f"{machine_id} health score dropped to {health_score} (below threshold {threshold})"
                ticket = Ticket(
                    source_module="maintenance",
                    type="machine_health",
                    status="open",
                    description=desc,
                )
                db.add(ticket)
                db.commit()
                db.refresh(ticket)

                try:
                    httpx.post(
                        f"{CHATBOT_SERVICE_URL}/notify",
                        json={"ticket_id": ticket.id, "description": ticket.description},
                        timeout=3.0,
                    )
                except Exception:
                    pass

                alerts_created.append({
                    "ticket_id": ticket.id,
                    "machine_id": machine_id,
                    "health_score": health_score,
                    "status": "ticket_created_and_notified"
                })
            else:
                alerts_created.append({
                    "ticket_id": existing.id,
                    "machine_id": machine_id,
                    "health_score": health_score,
                    "status": "existing_open_ticket"
                })

    return {
        "status": "ok",
        "threshold": threshold,
        "machines_checked": len(machines),
        "degraded_machines_count": len([m for m in machines if m.get("health_score", 100) < threshold]),
        "alerts": alerts_created,
        "machines": machines
    }

