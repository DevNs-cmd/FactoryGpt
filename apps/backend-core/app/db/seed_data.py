"""
Owner: Anuj
Multi-Tenant 14-Day Production-Grade Seed Dataset Generator.
"""
import random
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import Factory, FactoryLine, User, ProductionEvent, DowntimeEvent, DefectRecord, Ticket
from app.auth.security import get_password_hash

DOWNTIME_REASONS = [
    ("Line-1", "Line-1-Press01", 1200, "Hydraulic pressure drop on Stamping Press-01 — seal replacement required"),
    ("Line-2", "Line-2-St04", 450, "Conveyor sensor misalignment at Cell Assembly Station-4 — optical recalibration"),
    ("Line-1", "Line-1-Weld02", 720, "Robotic welding arm tip wear limit exceeded — electrode changed"),
    ("Line-3", "Line-3-QC02", 300, "Thermal camera lens fouling on QC Station-2 — lens cleaned and protective shroud inspected"),
    ("Line-2", "Line-2-AGV03", 600, "Unplanned material delay from Automated Guided Vehicle (AGV-03) battery change"),
    ("Line-1", "Line-1-Jig04", 540, "Pneumatic actuator leak on Clamping Jig #4 — valve replaced"),
    ("Line-3", "Line-3-Laser01", 900, "Laser cutter cooling water over-temperature alert — chiller filter flushed"),
    ("Line-2", "Line-2-Seal01", 480, "Thermal sealer bar calibration drift — heating element recalibrated"),
    ("Line-1", "Line-1-St01", 360, "Sheet metal feeding sensor jam — blanking line cleared"),
    ("Line-2", "Line-2-Pack02", 500, "Automated strapping machine tension error — strap reel replaced"),
]

DEFECT_SEEDS = [
    ("crack", 0.94, "s3://factorygpt-defects/line2-crack-402.jpg"),
    ("scratch", 0.88, "s3://factorygpt-defects/line1-scratch-108.jpg"),
    ("dent", 0.91, "s3://factorygpt-defects/line1-dent-229.jpg"),
    ("missing_component", 0.96, "s3://factorygpt-defects/line2-missing-15.jpg"),
    ("crack", 0.89, "s3://factorygpt-defects/line1-crack-211.jpg"),
    ("scratch", 0.92, "s3://factorygpt-defects/line3-scratch-99.jpg"),
    ("dent", 0.87, "s3://factorygpt-defects/line2-dent-310.jpg"),
    ("missing_component", 0.95, "s3://factorygpt-defects/line3-missing-04.jpg"),
]

TICKET_SEEDS = [
    ("maintenance", "machine_health", "open", "[ERP Work Order #4012] Excessive vibration (4.2 mm/s) detected on CNC Spindle M2. Maintenance technician dispatched."),
    ("vision", "defect", "acknowledged", "[ERP Work Order #4015] Repeated hairline crack defects detected by Vision AI on Line-2 Battery Enclosure batch #B-88. Quality lead notified."),
    ("safety", "safety", "closed", "[ERP Work Order #4008] Conveyor belt tension check completed on Line-1 Assembly. All bearings regreased."),
    ("maintenance", "machine_health", "open", "[ERP Work Order #4018] Thermal drift (+5.4 C) on Stamping Press-01 main motor bearing. Predictive maintenance inspection scheduled."),
    ("vision", "defect", "closed", "[ERP Work Order #4002] Scratch defect cluster on Line-1 hood panels resolved after sheet metal deburring tool replacement."),
    ("maintenance", "machine_health", "acknowledged", "[ERP Work Order #4019] Hydraulic fluid viscosity warning on Line-1 Press-01. Fluid sample sent for lab analysis."),
    ("safety", "safety", "closed", "[ERP Work Order #4005] Emergency stop test and light curtain verification completed across Line-2 Battery Cell stations."),
    ("vision", "defect", "open", "[ERP Work Order #4021] Missing component flag on Line-2 cell module #CM-119. Line speed temporarily reduced to 85%."),
    ("maintenance", "machine_health", "closed", "[ERP Work Order #4009] Routine lubrication and seal check completed on Line-3 Laser Cutter cooling pump."),
    ("safety", "safety", "open", "[ERP Work Order #4022] Operator safety interlock response latency alert on Line-1 Welding cell #3. Electrical review pending."),
]


def seed_database(db: Session, factory_id: Optional[int] = None, clear_existing: bool = False) -> dict:
    if clear_existing:
        if factory_id:
            db.query(ProductionEvent).filter(ProductionEvent.factory_id == factory_id).delete()
            db.query(DowntimeEvent).filter(DowntimeEvent.factory_id == factory_id).delete()
            db.query(DefectRecord).filter(DefectRecord.factory_id == factory_id).delete()
            db.query(Ticket).filter(Ticket.factory_id == factory_id).delete()
        else:
            db.query(ProductionEvent).delete()
            db.query(DowntimeEvent).delete()
            db.query(DefectRecord).delete()
            db.query(Ticket).delete()
        db.commit()

    now = datetime.now(timezone.utc)
    start_time = now - timedelta(days=14)

    # Determine factory lines
    line_config = {}
    if factory_id:
        factory_lines = db.query(FactoryLine).filter(FactoryLine.factory_id == factory_id).all()
        for fl in factory_lines:
            line_config[fl.name] = {"target": fl.target_per_shift, "min_eff": 0.78, "max_eff": 0.94}

    if not line_config:
        line_config = {
            "Line-1": {"target": 1500, "min_eff": 0.78, "max_eff": 0.94},
            "Line-2": {"target": 800,  "min_eff": 0.75, "max_eff": 0.92},
            "Line-3": {"target": 2000, "min_eff": 0.82, "max_eff": 0.96},
        }

    shifts = ["A", "B", "C"]
    shift_penalties = {"A": 0.0, "B": -0.02, "C": -0.05}

    production_count = 0
    for day in range(14):
        day_base = start_time + timedelta(days=day)
        for s_idx, shift in enumerate(shifts):
            shift_time = day_base + timedelta(hours=8 * s_idx)
            for line_id, cfg in line_config.items():
                eff = random.uniform(cfg["min_eff"], cfg["max_eff"]) + shift_penalties[shift]
                eff = max(0.70, min(0.98, eff))
                actual_count = int(cfg["target"] * eff)
                event = ProductionEvent(
                    factory_id=factory_id,
                    line_id=line_id,
                    count=actual_count,
                    target=cfg["target"],
                    shift=shift,
                    timestamp=shift_time,
                )
                db.add(event)
                production_count += 1

    downtime_count = 0
    lines_list = list(line_config.keys())
    for i in range(25):
        line_id, machine_id, base_duration, reason = random.choice(DOWNTIME_REASONS)
        # map line if custom
        actual_line = random.choice(lines_list)
        dt_time = start_time + timedelta(days=random.randint(0, 13), hours=random.randint(0, 23))
        dt = DowntimeEvent(
            factory_id=factory_id,
            line_id=actual_line,
            machine_id=f"{actual_line}-M{random.randint(1, 3)}",
            duration_seconds=int(base_duration * random.uniform(0.8, 1.4)),
            reason=reason,
            timestamp=dt_time,
        )
        db.add(dt)
        downtime_count += 1

    defect_count = 0
    for i in range(10):
        defect_type, conf, img = random.choice(DEFECT_SEEDS)
        df_time = start_time + timedelta(days=random.randint(0, 13), hours=random.randint(0, 23))
        df = DefectRecord(
            factory_id=factory_id,
            defect_type=defect_type,
            confidence=conf,
            image_ref=img,
            timestamp=df_time,
        )
        db.add(df)
        defect_count += 1

    ticket_count = 0
    for i in range(15):
        source_mod, t_type, status, desc = TICKET_SEEDS[i % len(TICKET_SEEDS)]
        tk_time = start_time + timedelta(days=random.randint(0, 13), hours=random.randint(0, 23))
        ticket = Ticket(
            factory_id=factory_id,
            source_module=source_mod,
            type=t_type,
            status=status,
            description=desc,
            created_at=tk_time,
        )
        db.add(ticket)
        ticket_count += 1

    db.commit()

    return {
        "status": "ok",
        "factory_id": factory_id,
        "message": "14-day production dataset seeded successfully",
        "records": {
            "production_events": production_count,
            "downtime_events": downtime_count,
            "defect_records": defect_count,
            "tickets": ticket_count,
        }
    }


def ensure_default_factory_seeded(db: Session):
    """Creates default factory and demo admin if database is completely empty."""
    factory = db.query(Factory).first()
    if not factory:
        factory = Factory(
            name="Tata Motors Pune Plant",
            code="TATA-7X3K",
            location="Pune, Maharashtra",
            industry="automotive",
        )
        db.add(factory)
        db.commit()
        db.refresh(factory)

        # Lines
        lines = [
            FactoryLine(factory_id=factory.id, name="Line-1", machine_count=3, target_per_shift=1500, shifts="A,B,C"),
            FactoryLine(factory_id=factory.id, name="Line-2", machine_count=3, target_per_shift=800, shifts="A,B,C"),
            FactoryLine(factory_id=factory.id, name="Line-3", machine_count=3, target_per_shift=2000, shifts="A,B,C"),
        ]
        for l in lines:
            db.add(l)
        db.commit()

        # Admin user
        admin = User(
            email="admin@factorygpt.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Vikram Rao",
            role="owner",
            factory_id=factory.id,
        )
        db.add(admin)
        db.commit()

        # Seed data
        seed_database(db, factory_id=factory.id, clear_existing=False)
        print(f"[startup] Default factory '{factory.name}' ({factory.code}) & admin user created.")
