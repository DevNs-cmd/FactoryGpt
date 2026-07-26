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
        .agg(count=("reason", "size"), total_downtime_seconds=("duration_seconds", "sum"))
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
