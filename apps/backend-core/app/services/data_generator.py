"""
Owner: Anuj
Multi-Tenant Synthetic "live factory" feed.
Simulates continuous factory operations for all registered factories according to their configured lines.
"""
import random
import threading
import time
from app.db.database import SessionLocal
from app.db.models import Factory, FactoryLine, ProductionEvent, DowntimeEvent

DOWNTIME_REASONS = ["jam", "material_shortage", "changeover", "operator_break", "unplanned_stop", "sensor_glitch"]


def _tick():
    db = SessionLocal()
    try:
        factories = db.query(Factory).all()
        if not factories:
            return

        for factory in factories:
            # Only simulate continuous live ticks for the Demo Plant (Factory ID 1 / TATA-7X3K).
            # All user-registered customer plants start completely clean at 0.
            if factory.id != 1 and factory.code != "TATA-7X3K":
                continue

            lines = db.query(FactoryLine).filter(FactoryLine.factory_id == factory.id).all()
            if not lines:
                line_names = ["Line-1", "Line-2", "Line-3"]
                targets = [1500, 800, 2000]
            else:
                line_names = [l.name for l in lines]
                targets = [l.target_per_shift for l in lines]

            for idx, line_name in enumerate(line_names):
                target_shift = targets[idx] if idx < len(targets) else 1000
                tick_target = max(5, int(target_shift / 100))
                actual_count = random.randint(int(tick_target * 0.75), int(tick_target * 1.05))

                db.add(ProductionEvent(
                    factory_id=factory.id,
                    line_id=line_name,
                    count=actual_count,
                    target=tick_target,
                    shift=random.choice(["A", "B", "C"]),
                ))

                if random.random() < 0.07:  # ~7% chance of a downtime blip
                    db.add(DowntimeEvent(
                        factory_id=factory.id,
                        line_id=line_name,
                        machine_id=f"{line_name}-M{random.randint(1, 3)}",
                        duration_seconds=random.randint(30, 480),
                        reason=random.choice(DOWNTIME_REASONS),
                    ))
        db.commit()
    except Exception as e:
        db.rollback()
        # Non-fatal generator error
        print(f"[data_generator] tick error: {e}")
    finally:
        db.close()


def start_background_generator(interval_seconds: int = 5):
    def loop():
        while True:
            _tick()
            time.sleep(interval_seconds)
    thread = threading.Thread(target=loop, daemon=True)
    thread.start()
