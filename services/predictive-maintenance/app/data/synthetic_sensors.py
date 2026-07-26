"""
Owner: Neerav
No real sensors exist, so this generates believable vibration/temperature/
RPM time-series per machine, with a slow degradation trend baked in so the
health model has something meaningful to detect.
"""
import random
import time
import math

MACHINES = ["Line-1-M1", "Line-1-M2", "Line-2-M1", "Line-2-M2", "Line-3-M1"]

# Each machine "ages" at a slightly different rate so the demo shows
# variety (some healthy, some degrading) instead of every machine looking
# identical.
_start_time = time.time()
_degradation_rate = {m: random.uniform(0.02, 0.08) for m in MACHINES}


def _age_hours(machine_id: str) -> float:
    return (time.time() - _start_time) / 3600 * (1 + _degradation_rate[machine_id])


def read_sensor(machine_id: str) -> dict:
    age = _age_hours(machine_id)
    baseline_vibration = 2.0 + age * 0.15
    baseline_temp = 55 + age * 0.5

    vibration = round(baseline_vibration + random.uniform(-0.3, 0.3), 2)
    temperature = round(baseline_temp + random.uniform(-1.5, 1.5), 1)
    rpm = random.randint(1450, 1550)

    return {
        "machine_id": machine_id,
        "vibration": vibration,
        "temperature": temperature,
        "rpm": rpm,
    }


def read_all_sensors() -> list:
    return [read_sensor(m) for m in MACHINES]
