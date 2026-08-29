"""
Owner: Neerav
Stateful Synthetic Sensor Telemetry Engine with Real-Time Degradation Progression.
State is mutated on each read cycle so live polling visibly shows equipment drift.
"""
import random
import time

MACHINES = ["Line-1-M1", "Line-1-M2", "Line-2-M1", "Line-2-M2", "Line-3-M1"]

# Degrading machines that progressively drift into critical warning thresholds
DEGRADING_MACHINES = {"Line-1-M2", "Line-2-M2"}

# In-memory persistent state per machine
_machine_state = {}


def _init_machine_state():
    global _machine_state
    _machine_state = {
        "Line-1-M1": {"vibration": 2.15, "temperature": 54.0, "rpm": 1495, "ticks": 0, "degrading": False},
        "Line-1-M2": {"vibration": 3.20, "temperature": 66.5, "rpm": 1480, "ticks": 0, "degrading": True},
        "Line-2-M1": {"vibration": 1.95, "temperature": 52.0, "rpm": 1510, "ticks": 0, "degrading": False},
        "Line-2-M2": {"vibration": 3.75, "temperature": 72.0, "rpm": 1460, "ticks": 0, "degrading": True},
        "Line-3-M1": {"vibration": 2.40, "temperature": 56.5, "rpm": 1500, "ticks": 0, "degrading": False},
    }


_init_machine_state()


def reset_sensor_simulation():
    """Resets all machines back to baseline states."""
    _init_machine_state()
    return {"status": "ok", "message": "Machine sensor telemetry reset to baseline."}


def read_sensor(machine_id: str) -> dict:
    global _machine_state
    if machine_id not in _machine_state:
        _machine_state[machine_id] = {
            "vibration": 2.2,
            "temperature": 55.0,
            "rpm": 1500,
            "ticks": 0,
            "degrading": machine_id.endswith("M2"),
        }

    st = _machine_state[machine_id]
    st["ticks"] += 1

    if st.get("degrading", False):
        # Progressively degrade
        drift_vib = random.uniform(0.05, 0.12)
        drift_temp = random.uniform(0.3, 0.8)
        st["vibration"] = min(7.5, st["vibration"] + drift_vib)
        st["temperature"] = min(98.0, st["temperature"] + drift_temp)
        st["rpm"] = max(1350, st["rpm"] - random.randint(1, 4))
    else:
        # Stable healthy machines hover around normal baseline with slight Gaussian variance
        base_vib = 2.1
        base_temp = 54.0
        st["vibration"] = round(base_vib + random.uniform(-0.15, 0.15), 2)
        st["temperature"] = round(base_temp + random.uniform(-1.0, 1.0), 1)
        st["rpm"] = random.randint(1490, 1515)

    return {
        "machine_id": machine_id,
        "vibration": round(st["vibration"], 2),
        "temperature": round(st["temperature"], 1),
        "rpm": int(st["rpm"]),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


def read_all_sensors() -> list:
    return [read_sensor(m) for m in MACHINES]
