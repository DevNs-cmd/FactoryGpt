"""
Owner: Anuj
Production monitoring endpoints — reads what services/data_generator.py writes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import ProductionEvent, DowntimeEvent
from app.schemas import ProductionEventOut, DowntimeEventOut
from typing import List

router = APIRouter(prefix="/production", tags=["production"])


@router.get("/live", response_model=List[ProductionEventOut])
def get_live_production(limit: int = 20, db: Session = Depends(get_db)):
    """Most recent production counts — used by the dashboard's live view."""
    return (
        db.query(ProductionEvent)
        .order_by(desc(ProductionEvent.timestamp))
        .limit(limit)
        .all()
    )


@router.get("/downtime", response_model=List[DowntimeEventOut])
def get_downtime(limit: int = 50, db: Session = Depends(get_db)):
    """Raw downtime log — this is what root-cause-analysis (Vedant) pulls
    via HTTP instead of touching Postgres directly."""
    return (
        db.query(DowntimeEvent)
        .order_by(desc(DowntimeEvent.timestamp))
        .limit(limit)
        .all()
    )
