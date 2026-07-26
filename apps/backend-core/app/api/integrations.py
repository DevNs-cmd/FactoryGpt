"""
Owner: Anuj
The frontend's ONLY window into the other 4 services. Each call is wrapped
so that a service being down, slow, or not-yet-built never breaks the
dashboard — it just shows that module as offline.
"""
import os
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/integrations", tags=["integrations"])

VISION_URL = os.getenv("VISION_SERVICE_URL", "http://localhost:8001")
CHATBOT_URL = os.getenv("CHATBOT_SERVICE_URL", "http://localhost:8002")
MAINTENANCE_URL = os.getenv("MAINTENANCE_SERVICE_URL", "http://localhost:8003")
ROOTCAUSE_URL = os.getenv("ROOTCAUSE_SERVICE_URL", "http://localhost:8004")


def _safe_get(url: str):
    try:
        r = httpx.get(url, timeout=3.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return None


@router.get("/overview")
def overview():
    """One combined payload for the main dashboard."""
    return {
        "vision": _safe_get(f"{VISION_URL}/health"),
        "maintenance": _safe_get(f"{MAINTENANCE_URL}/machine-health"),
        "root_cause": _safe_get(f"{ROOTCAUSE_URL}/root-cause"),
    }


@router.post("/chat")
def chat_proxy(payload: dict):
    """Frontend calls backend-core, backend-core forwards to Gauri's service."""
    try:
        r = httpx.post(f"{CHATBOT_URL}/chat", json=payload, timeout=15.0)
        r.raise_for_status()
        return r.json()
    except httpx.HTTPError:
        return {"error": "chatbot-assistant is unavailable right now"}
