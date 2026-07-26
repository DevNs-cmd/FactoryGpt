"""
Owner: Vedant
One shared function used by BOTH the GET /report endpoint and Gauri's
chatbot (via HTTP) — so a "generate quality report" request from the
chatbot doesn't require duplicating this logic in her service.
"""
from app.analytics.queries import root_cause_breakdown, _fetch_downtime_df


def generate_report() -> dict:
    breakdown = root_cause_breakdown()
    df = _fetch_downtime_df()

    top_causes = [row["reason"] for row in breakdown["by_reason"][:3]]

    if not top_causes:
        summary = "No downtime events logged yet."
    else:
        summary = (
            f"Over the logged period, the top downtime causes were "
            f"{', '.join(top_causes)}. "
            f"The worst-performing machine was {breakdown['worst_machine']} "
            f"on {breakdown['worst_line']}."
        )

    return {
        "summary": summary,
        "top_causes": top_causes,
        "total_downtime_events": int(len(df)),
    }
