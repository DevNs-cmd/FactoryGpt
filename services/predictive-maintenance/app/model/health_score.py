"""
Owner: Neerav
Turns raw sensor readings into a 0-100 health score + a rough
"days to failure" estimate. A simple weighted-threshold model is enough for
a convincing demo — you don't need deep learning here.
"""
VIBRATION_SAFE_MAX = 3.5
TEMP_SAFE_MAX = 70.0


def compute_health(reading: dict) -> dict:
    vibration_penalty = max(0, (reading["vibration"] - VIBRATION_SAFE_MAX)) * 15
    temp_penalty = max(0, (reading["temperature"] - TEMP_SAFE_MAX)) * 2

    health_score = max(0, min(100, round(100 - vibration_penalty - temp_penalty)))

    # crude linear extrapolation for demo purposes
    if health_score >= 80:
        days_to_failure = 60
    elif health_score >= 60:
        days_to_failure = 30
    elif health_score >= 40:
        days_to_failure = 10
    else:
        days_to_failure = 2

    return {
        **reading,
        "health_score": health_score,
        "predicted_days_to_failure": days_to_failure,
    }
