"""
Owner: Anuj
Production monitoring endpoints — reads what services/data_generator.py writes.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.db.database import get_db
from app.db.models import ProductionEvent, DowntimeEvent
from app.schemas import ProductionEventOut, DowntimeEventOut, ProductionSummaryOut
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


@router.get("/summary", response_model=ProductionSummaryOut)
def get_production_summary(db: Session = Depends(get_db)):
    """OEE-style aggregation: actual vs target %, per shift and line."""
    events = db.query(ProductionEvent).all()

    total_count = sum(e.count for e in events)
    total_target = sum(e.target for e in events)
    overall_efficiency = round((total_count / total_target * 100.0), 2) if total_target > 0 else 0.0

    shift_map = {}
    for e in events:
        s = e.shift or "A"
        if s not in shift_map:
            shift_map[s] = {"count": 0, "target": 0}
        shift_map[s]["count"] += e.count
        shift_map[s]["target"] += e.target

    by_shift = []
    for s, data in sorted(shift_map.items()):
        eff = round((data["count"] / data["target"] * 100.0), 2) if data["target"] > 0 else 0.0
        by_shift.append({
            "shift": s,
            "count": data["count"],
            "target": data["target"],
            "efficiency_pct": eff
        })

    line_map = {}
    for e in events:
        l = e.line_id or "Line-1"
        if l not in line_map:
            line_map[l] = {"count": 0, "target": 0}
        line_map[l]["count"] += e.count
        line_map[l]["target"] += e.target

    by_line = []
    for l, data in sorted(line_map.items()):
        eff = round((data["count"] / data["target"] * 100.0), 2) if data["target"] > 0 else 0.0
        by_line.append({
            "line_id": l,
            "count": data["count"],
            "target": data["target"],
            "efficiency_pct": eff
        })

    return {
        "total_count": total_count,
        "total_target": total_target,
        "overall_efficiency_pct": overall_efficiency,
        "by_shift": by_shift,
        "by_line": by_line
    }


@router.post("/seed")
def seed_production_data(clear_existing: bool = True, db: Session = Depends(get_db)):
    """Populates the database with 14 days of realistic production, downtime, defect, and ERP ticket data."""
    from app.db.seed_data import seed_database
    return seed_database(db, clear_existing=clear_existing)


