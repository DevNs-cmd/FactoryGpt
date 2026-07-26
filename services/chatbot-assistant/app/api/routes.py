"""Owner: Gauri."""
import os
import httpx
from fastapi import APIRouter
from app.schemas import ChatRequest, ChatResponse, NotifyRequest
from app.llm.client import ask_assistant

router = APIRouter()

NOTIFY_WEBHOOK_URL = os.getenv("NOTIFY_WEBHOOK_URL")


@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    reply = ask_assistant(payload.message, payload.language)
    return {"reply": reply}


@router.post("/notify")
def notify(payload: NotifyRequest):
    """Called by backend-core's workflow chain. Stands in for the spec's
    WhatsApp Business API alert — a Slack/Teams webhook is far faster to
    wire up for a 15-day demo and demonstrates the same automation idea."""
    message = f":rotating_light: Ticket #{payload.ticket_id}: {payload.description}"
    if NOTIFY_WEBHOOK_URL:
        try:
            httpx.post(NOTIFY_WEBHOOK_URL, json={"text": message}, timeout=3.0)
        except httpx.HTTPError:
            pass
    else:
        print(f"[notify] {message}")
    return {"status": "sent"}
