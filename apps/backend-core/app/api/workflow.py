"""
Owner: Anuj
The Workflow Automation chain: defect/alert comes in -> logged -> Ticket
created -> Gauri's /notify called -> (mock) ERP log updated.
This is the single endpoint that proves the system is "one connected
factory OS" rather than 5 separate demos.
"""
import os
import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import DefectRecord, Ticket
from app.schemas import DefectEventIn, TicketOut

router = APIRouter(prefix="/workflow", tags=["workflow"])

CHATBOT_SERVICE_URL = os.getenv("CHATBOT_SERVICE_URL", "http://localhost:8002")


@router.post("/defect-event", response_model=TicketOut)
def defect_event(event: DefectEventIn, db: Session = Depends(get_db)):
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

    # 3. fire the notification (best-effort — a dead chatbot service must
    # never crash this endpoint, it should just skip the notify step)
    try:
        httpx.post(
            f"{CHATBOT_SERVICE_URL}/notify",
            json={"ticket_id": ticket.id, "description": ticket.description},
            timeout=3.0,
        )
    except httpx.HTTPError:
        pass

    # 4. "update ERP" — stand-in for a real SAP/Oracle call for the demo
    print(f"[mock-erp] logged ticket #{ticket.id}: {ticket.description}")

    return ticket
