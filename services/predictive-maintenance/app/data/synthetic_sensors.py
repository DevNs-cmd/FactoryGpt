"""
Owner: Neerav
No real sensors exist, so this generates believable vibration/temperature/
RPM readings per machine. State is mutated slightly on every call rather
than recomputed from scratch, which is what makes a real trend visible
across repeated polling instead of requiring the demo to sit idle for real
wall-clock time. A subset of machines is flagged degrading (steady drift
toward failure); the rest mean-revert around a fixed baseline so they read
as healthy noise, not a slow climb.
"""
import random
from collections import deque
from datetime import datetime, timezone

MACHINES = ["Line-1-M1", "Line-1-M2", "Line-2-M1", "Line-2-M2", "Line-3-M1"]

_HISTORY_MAXLEN = 200

# Hardcoded (not random.sample) so the demo story is identical across every
# --reload restart and every fresh server launch, instead of changing which
# machines are "sick" every time a file is saved during development.
DEGRADING_MACHINES = {"Line-1-M2", "Line-3-M1"}

_state: dict = {}
_history: dict = {m: deque(maxlen=_HISTORY_MAXLEN) for m in MACHINES}


def _init_state():
    for m in MACHINES:
        baseline_vibration = round(random.uniform(2.0, 2.5), 2)
        baseline_temperature = round(random.uniform(55.0, 60.0), 1)
        _state[m] = {
            "vibration": baseline_vibration,
            "temperature": baseline_temperature,
            "rpm": random.randint(1450, 1550),
            "_baseline_vibration": baseline_vibration,
            "_baseline_temperature": baseline_temperature,
            # jitter so multiple degrading machines don't cross the alert
            # threshold in lockstep
            "_drift_mult": random.uniform(0.85, 1.15),
        }


_init_state()


def read_sensor(machine_id: str) -> dict:
    s = _state[machine_id]

    if machine_id in DEGRADING_MACHINES:
        s["vibration"] += 0.06 * s["_drift_mult"] + random.gauss(0, 0.05)
        s["temperature"] += 0.35 * s["_drift_mult"] + random.gauss(0, 0.3)
    else:
        # mean-reverting step: pulls back toward baseline each call so the
        # machine hovers with no net drift, instead of a random walk whose
        # variance would still grow unbounded over hundreds of calls
        k = 0.3
        s["vibration"] += k * (s["_baseline_vibration"] - s["vibration"]) + random.gauss(0, 0.08)
        s["temperature"] += k * (s["_baseline_temperature"] - s["temperature"]) + random.gauss(0, 0.4)

    s["rpm"] = random.randint(1450, 1550)

    reading = {
        "machine_id": machine_id,
        "vibration": round(s["vibration"], 2),
        "temperature": round(s["temperature"], 1),
        "rpm": s["rpm"],
        "timestamp": datetime.now(timezone.utc),
    }
    _history[machine_id].append(reading)
    return reading


def read_all_sensors() -> list:
    return [read_sensor(m) for m in MACHINES]


def get_history(machine_id: str, limit: int = 50) -> list:
    if machine_id not in MACHINES:
        raise ValueError(f"unknown machine_id, expected one of {MACHINES}")
    return list(_history[machine_id])[-limit:]