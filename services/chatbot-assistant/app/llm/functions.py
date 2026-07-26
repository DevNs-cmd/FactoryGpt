"""
Owner: Gauri
Function-calling tools the LLM can invoke. Each one calls backend-core or
root-cause-analysis over HTTP — never a database directly.
"""
import os
import httpx

BACKEND_CORE_URL = os.getenv("BACKEND_CORE_URL", "http://localhost:8000")
ROOTCAUSE_URL = os.getenv("ROOTCAUSE_SERVICE_URL", "http://localhost:8004")


def get_recent_defects():
    try:
        r = httpx.get(f"{BACKEND_CORE_URL}/production/downtime", timeout=5.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return {"error": "backend-core unavailable"}


def get_downtime_log(line_id: str = None):
    try:
        r = httpx.get(f"{BACKEND_CORE_URL}/production/downtime", timeout=5.0)
        r.raise_for_status()
        data = r.json()
        if line_id:
            data = [d for d in data if d.get("line_id") == line_id]
        return data
    except httpx.HTTPError:
        return {"error": "backend-core unavailable"}


def get_production_summary():
    try:
        r = httpx.get(f"{BACKEND_CORE_URL}/production/live", timeout=5.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return {"error": "backend-core unavailable"}


def get_report():
    try:
        r = httpx.get(f"{ROOTCAUSE_URL}/report", timeout=5.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return {"error": "root-cause-analysis unavailable"}


# Tool schema passed to the LLM's function-calling API
TOOLS = [
    {
        "name": "get_recent_defects",
        "description": "Get today's rejected/defective products",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_downtime_log",
        "description": "Get downtime events, optionally filtered by line",
        "input_schema": {
            "type": "object",
            "properties": {"line_id": {"type": "string"}},
        },
    },
    {
        "name": "get_production_summary",
        "description": "Get current production counts vs target, by shift",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_report",
        "description": "Get a generated quality/root-cause report",
        "input_schema": {"type": "object", "properties": {}},
    },
]

FUNCTION_MAP = {
    "get_recent_defects": get_recent_defects,
    "get_downtime_log": get_downtime_log,
    "get_production_summary": get_production_summary,
    "get_report": get_report,
}
