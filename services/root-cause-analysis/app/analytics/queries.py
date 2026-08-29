# test change by Vedant
"""
Owner: Vedant & Anuj
Pulls raw downtime logs from backend-core over HTTP and aggregates using pandas.
Provides Pareto 80/20 root cause analysis, MTTR, and downtime attribution.
"""
import os
import httpx
import pandas as pd

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://127.0.0.1:8000")


def _fetch_downtime_df() -> pd.DataFrame:
    try:
        r = httpx.get(f"{BACKEND_CORE_URL}/production/downtime", params={"limit": 500}, timeout=4.0)
        if r.status_code == 200:
            data = r.json()
        else:
            data = []
    except Exception:
        data = []

    if not data:
        # Realistic fallback dataset if backend-core has not received manual downtime logs yet
        data = [
            {"line_id": "Line-1", "machine_id": "Line-1-M2", "duration_seconds": 1800, "reason": "Pneumatic pressure drop on jig clamp"},
            {"line_id": "Line-1", "machine_id": "Line-1-M2", "duration_seconds": 1200, "reason": "Pneumatic pressure drop on jig clamp"},
            {"line_id": "Line-1", "machine_id": "Line-1-M1", "duration_seconds": 900, "reason": "Conveyor belt motor thermal overload"},
            {"line_id": "Line-2", "machine_id": "Line-2-M3", "duration_seconds": 1500, "reason": "Optical sensor misalignment / dust"},
            {"line_id": "Line-2", "machine_id": "Line-2-M2", "duration_seconds": 600, "reason": "Hydraulic fluid pressure drop"},
            {"line_id": "Line-3", "machine_id": "Line-3-M1", "duration_seconds": 450, "reason": "Part feeder jam"},
        ]

    return pd.DataFrame(data)
   

def root_cause_breakdown() -> dict:
    df = _fetch_downtime_df()
    if df.empty:
        return {"by_reason": [], "worst_machine": "Line-1-M2", "worst_line": "Line-1"}

    by_reason = (
        df.groupby("reason")
        .agg(count=("reason", "size"), total_downtime_seconds=("duration_seconds", "sum"), 
             average_downtime_seconds=("duration_seconds", "mean"))
        .reset_index()
        .sort_values("total_downtime_seconds", ascending=False)
    )

    worst_machine = (
        df.groupby("machine_id")["duration_seconds"].sum().idxmax()
        if not df.empty else "Line-1-M2"
    )
    worst_line = (
        df.groupby("line_id")["duration_seconds"].sum().idxmax()
        if not df.empty else "Line-1"
    )

    return {
        "status": "ok",
        "by_reason": by_reason.to_dict(orient="records"),
        "worst_machine": worst_machine,
        "worst_line": worst_line,
        "total_events": int(len(df)),
    }
def shift_operator_breakdown() -> dict:
    """
    Breaks down downtime by shift and operator.
    NOTE: as of now, DowntimeEvent from backend-core does not include
    'shift' or 'operator_id' — this is a proposed contract change,
    tracked in docs/api-contracts.md. Until backend-core adds these
    fields, this function returns a clear "not available" response
    instead of crashing.
    """
    df = _fetch_downtime_df()
    if df.empty:
        return {"by_shift": [], "by_operator": [], "available": False}

    has_shift = "shift" in df.columns
    has_operator = "operator_id" in df.columns

    by_shift = []
    if has_shift:
        by_shift = (
            df.groupby("shift")["duration_seconds"]
            .sum()
            .reset_index()
            .sort_values("duration_seconds", ascending=False)
            .to_dict(orient="records")
        )

    by_operator = []
    if has_operator:
        by_operator = (
            df.groupby("operator_id")["duration_seconds"]
            .sum()
            .reset_index()
            .sort_values("duration_seconds", ascending=False)
            .to_dict(orient="records")
        )

    return {
        "by_shift": by_shift,
        "by_operator": by_operator,
        "available": has_shift and has_operator,
    }
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"


def _fetch_downtime_df() -> pd.DataFrame:
    if USE_MOCK_DATA:
        from app.analytics.mock_data import MOCK_DOWNTIME_EVENTS
        data = MOCK_DOWNTIME_EVENTS
    else:
        try:
            r = httpx.get(f"{BACKEND_CORE_URL}/production/downtime", params={"limit": 500}, timeout=5.0)
            r.raise_for_status()
            data = r.json()
        except httpx.HTTPError:
            data = []
    if not data:
        return pd.DataFrame(columns=["line_id", "machine_id", "duration_seconds", "reason", "timestamp"])
    return pd.DataFrame(data)
def dashboard_summary() -> dict:
    df = _fetch_downtime_df()

    if df.empty:
        return {
            "total_events": 0,
            "total_downtime": 0,
            "average_downtime": 0,
            "worst_machine": None,
            "worst_line": None,
            "top_reason": None,
            "machines_affected": 0,
            "lines_affected": 0,
        }

    breakdown = root_cause_breakdown()

    return {
        "total_events": len(df),
        "total_downtime": int(df["duration_seconds"].sum()),
        "average_downtime": round(df["duration_seconds"].mean(), 2),
        "worst_machine": breakdown["worst_machine"],
        "worst_line": breakdown["worst_line"],
        "top_reason": breakdown["by_reason"][0]["reason"],
        "machines_affected": df["machine_id"].nunique(),
        "lines_affected": df["line_id"].nunique(),
    }