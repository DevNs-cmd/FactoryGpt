"""
Owner: Anuj
Production monitoring endpoints with Multi-Tenant Factory isolation & CSV bulk import.
"""
import io
import csv
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.database import get_db
from app.db.models import ProductionEvent, DowntimeEvent, Factory, User
from app.schemas import (
    ProductionEventOut,
    DowntimeEventOut,
    ProductionSummaryOut,
    ManualProductionLogIn,
    ManualDowntimeLogIn,
)
from app.auth.security import get_current_user, get_current_user_optional

router = APIRouter(prefix="/production", tags=["production"])


def _resolve_factory_id(user: Optional[User], db: Session) -> Optional[int]:
    if user and user.factory_id:
        return user.factory_id
    first_f = db.query(Factory).first()
    return first_f.id if first_f else 1


@router.get("/live", response_model=List[ProductionEventOut])
def get_live_production(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Most recent production counts for the user's factory."""
    factory_id = _resolve_factory_id(user, db)
    query = db.query(ProductionEvent)
    if factory_id:
        query = query.filter(ProductionEvent.factory_id == factory_id)

    return (
        query.order_by(desc(ProductionEvent.timestamp))
        .limit(limit)
        .all()
    )


@router.get("/downtime", response_model=List[DowntimeEventOut])
def get_downtime(
    limit: int = 50,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Raw downtime log for the user's factory."""
    factory_id = _resolve_factory_id(user, db)
    query = db.query(DowntimeEvent)
    if factory_id:
        query = query.filter(DowntimeEvent.factory_id == factory_id)

    return (
        query.order_by(desc(DowntimeEvent.timestamp))
        .limit(limit)
        .all()
    )


@router.get("/summary", response_model=ProductionSummaryOut)
def get_production_summary(
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """OEE-style aggregation: actual vs target %, per shift and line for the user's factory."""
    factory_id = _resolve_factory_id(user, db)
    query = db.query(ProductionEvent)
    if factory_id:
        query = query.filter(ProductionEvent.factory_id == factory_id)

    events = query.all()

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
            "efficiency_pct": eff,
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
            "efficiency_pct": eff,
        })

    # If new factory with 0 events, populate lines from factory configuration with 0 counts
    if not events and factory_id:
        from app.db.models import FactoryLine
        f_lines = db.query(FactoryLine).filter(FactoryLine.factory_id == factory_id).all()
        for fl in f_lines:
            by_line.append({
                "line_id": fl.name,
                "count": 0,
                "target": fl.target_per_shift,
                "efficiency_pct": 0.0,
            })
        for s in ["A", "B", "C"]:
            by_shift.append({
                "shift": s,
                "count": 0,
                "target": sum(fl.target_per_shift for fl in f_lines) if f_lines else 1000,
                "efficiency_pct": 0.0,
            })

    return {
        "total_count": total_count,
        "total_target": total_target,
        "overall_efficiency_pct": overall_efficiency,
        "by_shift": by_shift,
        "by_line": by_line,
    }


@router.post("/log", response_model=ProductionEventOut)
def log_manual_production(
    payload: ManualProductionLogIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Allows manual entry of production counts."""
    event = ProductionEvent(
        factory_id=user.factory_id,
        line_id=payload.line_id,
        count=payload.count,
        target=payload.target,
        shift=payload.shift,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/downtime/log", response_model=DowntimeEventOut)
def log_manual_downtime(
    payload: ManualDowntimeLogIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Allows manual logging of equipment downtime incidents."""
    event = DowntimeEvent(
        factory_id=user.factory_id,
        line_id=payload.line_id,
        machine_id=payload.machine_id,
        duration_seconds=payload.duration_seconds,
        reason=payload.reason,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.post("/import-csv")
async def import_production_csv(
    file: UploadFile = File(...),
    clear_existing: bool = False,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Imports a factory's custom production CSV/Excel export.
    Supports huge datasets with multi-floor & multi-line topologies.
    """
    factory_id = _resolve_factory_id(user, db)
    content = await file.read()
    decoded = content.decode("utf-8", errors="ignore")
    reader = csv.DictReader(io.StringIO(decoded))

    if clear_existing:
        db.query(ProductionEvent).filter(ProductionEvent.factory_id == factory_id).delete()
        db.commit()

    events_to_add = []
    for row in reader:
        # Flexible key matching (case-insensitive)
        clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        line_id = clean_row.get("line_id") or clean_row.get("line") or clean_row.get("floor_line") or "Floor-1-Line-1"
        try:
            count = int(float(clean_row.get("count", clean_row.get("actual", clean_row.get("output", 100)))))
            target = int(float(clean_row.get("target", 120)))
        except (ValueError, TypeError):
            continue

        shift = clean_row.get("shift", "A").upper()

        event = ProductionEvent(
            factory_id=factory_id,
            line_id=line_id,
            count=count,
            target=target,
            shift=shift,
        )
        events_to_add.append(event)

    # High-performance batch insertion
    if events_to_add:
        db.bulk_save_objects(events_to_add)
        db.commit()

    return {
        "status": "ok",
        "message": f"Successfully imported {len(events_to_add)} production records across factory floors.",
        "records_imported": len(events_to_add),
    }


@router.post("/seed")
def seed_production_data(
    clear_existing: bool = True,
    db: Session = Depends(get_db),
    user: Optional[User] = Depends(get_current_user_optional),
):
    """Populates the database with 14 days of realistic production, downtime, defect, and ERP ticket data."""
    from app.db.seed_data import seed_database
    factory_id = _resolve_factory_id(user, db)
    return seed_database(db, factory_id=factory_id, clear_existing=clear_existing)
