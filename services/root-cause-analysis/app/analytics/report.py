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

    top_causes = breakdown["by_reason"][:3]

    if not top_causes:
        summary = (
            "No downtime events were recorded during the selected period. "
            "Production appears to have operated normally."
        )
    else:
        primary_cause = top_causes[0]

        summary = (
            f"A total of {len(df)} downtime events were recorded during the analyzed period. "
            f"The leading cause of downtime was '{primary_cause['reason']}', "
            f"responsible for {primary_cause['total_downtime_seconds']} seconds "
            f"across {primary_cause['count']} incidents. "
            f"The machine with the highest accumulated downtime was "
            f"{breakdown['worst_machine']}, while the most affected production line "
            f"was {breakdown['worst_line']}. "
            f"Management should prioritize investigation of "
            f"{primary_cause['reason']} to improve production availability."
        )

    return {
        "summary": summary,
        "top_causes": top_causes,
        "worst_machine": breakdown["worst_machine"],
        "worst_line": breakdown["worst_line"],
        "total_downtime_events": int(len(df)),
    }
