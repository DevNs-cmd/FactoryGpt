"""
Owner: Anuj
Synthetic "live factory" feed. There's no real PLC/sensor to poll in 15
days, so this background loop fakes one — every few seconds it writes a
plausible production count and occasionally a downtime event.
"""
import random
import threading
import time
from app.db.database import SessionLocal
from app.db.models import ProductionEvent, DowntimeEvent

LINES = ["Line-1", "Line-2", "Line-3"]
DOWNTIME_REASONS = ["jam", "material_shortage", "changeover", "operator_break", "unplanned_stop"]


def _tick():
    db = SessionLocal()
    try:
        for line in LINES:
            db.add(ProductionEvent(
                line_id=line,
                count=random.randint(8, 15),
                target=15,
                shift=random.choice(["A", "B", "C"]),
            ))
            if random.random() < 0.08:  # ~8% chance of a downtime blip per tick
                db.add(DowntimeEvent(
                    line_id=line,
                    machine_id=f"{line}-M{random.randint(1,3)}",
                    duration_seconds=random.randint(30, 600),
                    reason=random.choice(DOWNTIME_REASONS),
                ))
        db.commit()
    finally:
        db.close()


def start_background_generator(interval_seconds: int = 5):
    def loop():
        while True:
            _tick()
            time.sleep(interval_seconds)
    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
