"""
Owner: Neerav
Turns raw sensor readings into a 0-100 health score + a rough
"days to failure" estimate. A trained scikit-learn regressor (see train.py)
is used when its artifact is present; the original hand-written threshold
formula is kept as the safety-net fallback if the artifact is missing or
fails to load, so this can never crash the app.
"""
import os

VIBRATION_SAFE_MAX = 3.5
TEMP_SAFE_MAX = 70.0

FEATURES = ["vibration", "temperature", "rpm"]

MODEL_WEIGHTS_PATH = os.getenv(
    "MODEL_WEIGHTS_PATH",
    os.path.join(os.path.dirname(__file__), "weights", "health_regressor.joblib"),
)

_model = None
_model_load_failed = False


def _rule_based_score(reading: dict) -> float:
    vibration_penalty = max(0, (reading["vibration"] - VIBRATION_SAFE_MAX)) * 15
    temp_penalty = max(0, (reading["temperature"] - TEMP_SAFE_MAX)) * 2
    return max(0, min(100, 100 - vibration_penalty - temp_penalty))


def _load_model():
    global _model, _model_load_failed
    if _model is None and not _model_load_failed and os.path.exists(MODEL_WEIGHTS_PATH):
        try:
            import joblib
            _model = joblib.load(MODEL_WEIGHTS_PATH)
        except Exception:
            _model_load_failed = True
    return _model


def _ml_score(reading: dict):
    model = _load_model()
    if model is None:
        return None
    try:
        vector = [[reading[f] for f in FEATURES]]
        return float(model.predict(vector)[0])
    except Exception:
        return None


def _days_to_failure(health_score: int) -> int:
    if health_score >= 80:
        return 60
    elif health_score >= 60:
        return 30
    elif health_score >= 40:
        return 10
    else:
        return 2


def compute_health(reading: dict) -> dict:
    score = _ml_score(reading)
    if score is None:
        score = _rule_based_score(reading)

    health_score = max(0, min(100, round(score)))

    return {
        **reading,
        "health_score": health_score,
        "predicted_days_to_failure": _days_to_failure(health_score),
    }
