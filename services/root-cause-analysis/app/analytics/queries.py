# test change by Vedant
"""
Owner: Vedant
Pulls raw logs from backend-core over HTTP (never touches Postgres
directly — see docs/api-contracts.md) and aggregates with pandas. This is
where your DSA + data-analysis skillset does the actual work.
"""
import os
import httpx
import pandas as pd

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")


def _fetch_downtime_df() -> pd.DataFrame:
    try:
        r = httpx.get(f"{BACKEND_CORE_URL}/production/downtime", params={"limit": 500}, timeout=5.0)
        r.raise_for_status()
        data = r.json()
    except httpx.HTTPError:
        data = []
    if not data:
        return pd.DataFrame(columns=["line_id", "machine_id", "duration_seconds", "reason", "timestamp"])
    return pd.DataFrame(data)
   

def root_cause_breakdown() -> dict:
    df = _fetch_downtime_df()
    if df.empty:
        return {"by_reason": [], "worst_machine": None, "worst_line": None}

    by_reason = (
        df.groupby("reason")
        .agg(count=("reason", "size"), total_downtime_seconds=("duration_seconds", "sum"), 
             average_downtime_seconds=("duration_seconds", "mean"))
        .reset_index()
        .sort_values("total_downtime_seconds", ascending=False)
    )

    worst_machine = (
        df.groupby("machine_id")["duration_seconds"].sum().idxmax()
        if not df.empty else None
    )
    worst_line = (
        df.groupby("line_id")["duration_seconds"].sum().idxmax()
        if not df.empty else None
    )

    return {
        "by_reason": by_reason.to_dict(orient="records"),
        "worst_machine": worst_machine,
        "worst_line": worst_line,
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