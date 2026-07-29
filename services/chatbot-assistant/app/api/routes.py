"""
Owner: Gauri
FastAPI API router for FactoryGPT Enterprise AI Assistant.
"""
import os
import json
import httpx
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, WebSocket, WebSocketDisconnect, Query
from app.schemas import (
    ChatRequest, ChatResponse, VoiceResponse, ChatHistoryItem, ReportResponse, NotifyRequest, TokenRequest
)
from app.auth import get_current_user, create_access_token
from app.llm.client import ask_assistant
from app.llm.voice import transcribe_audio
from app.db import log_chat_event, get_chat_history, clear_chat_history
from app.llm.functions import get_report

router = APIRouter()

NOTIFY_WEBHOOK_URL = os.getenv("NOTIFY_WEBHOOK_URL")

@router.post("/token")
def issue_token(payload: TokenRequest):
    """Helper endpoint to generate JWT tokens for different roles during testing/demo."""
    token = create_access_token(user_id=payload.user_id, role=payload.role, department=payload.department)
    return {"access_token": token, "token_type": "bearer", "role": payload.role}

@router.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, user: dict = Depends(get_current_user)):
    """Primary chat endpoint for text queries."""
    user_id = payload.user_id or user.get("sub", "user-001")
    role = payload.role or user.get("role", "Production Manager")
    department = payload.department or user.get("department", "Production")

    res = ask_assistant(message=payload.message, language=payload.language, role=role)

    # Log query and metadata
    log_chat_event(
        user_id=user_id,
        role=role,
        department=department,
        message=payload.message,
        language=payload.language,
        answer=res["answer"],
        source=res["source"],
        confidence=res["confidence"],
        suggestions=res["suggestions"],
        execution_time_ms=res.get("execution_time_ms", 0.0),
        model_used=res.get("model_used", "llama-3.3-70b-versatile"),
        api_cost=0.0005
    )

    return {
        "answer": res["answer"],
        "reply": res["answer"], # Legacy contract compatibility
        "source": res["source"],
        "confidence": res["confidence"],
        "suggestions": res["suggestions"],
        "execution_time_ms": res.get("execution_time_ms", 0.0),
        "model_used": res.get("model_used", "llama-3.3-70b-versatile")
    }

@router.post("/voice", response_model=VoiceResponse)
async def voice_chat(
    file: UploadFile = File(...),
    language: str = Form("en"),
    user_id: str = Form("user-001"),
    role: str = Form("Production Manager"),
    user: dict = Depends(get_current_user)
):
    """Voice chat endpoint converting speech to text then executing assistant query."""
    contents = await file.read()
    transcription = transcribe_audio(contents, filename=file.filename or "voice.wav")
    
    chat_payload = ChatRequest(
        message=transcription,
        language=language,
        user_id=user_id,
        role=role
    )
    chat_res = chat(chat_payload, user=user)
    
    return {
        "transcription": transcription,
        "response": chat_res
    }

@router.get("/history", response_model=List[ChatHistoryItem])
def history(
    user_id: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    limit: int = Query(50),
    user: dict = Depends(get_current_user)
):
    """Retrieve chat history and past queries with search support."""
    effective_user_id = user_id or (user.get("sub") if user.get("sub") != "anonymous" else None)
    return get_chat_history(user_id=effective_user_id, query=query, limit=limit)

@router.delete("/history")
def delete_history(user_id: Optional[str] = Query(None), user: dict = Depends(get_current_user)):
    """Clear chat history."""
    effective_user_id = user_id or (user.get("sub") if user.get("sub") != "anonymous" else None)
    clear_chat_history(user_id=effective_user_id)
    return {"status": "success", "message": "Chat history cleared successfully"}

@router.get("/reports", response_model=ReportResponse)
def reports():
    """Retrieve executive production and quality report."""
    rep_res = get_report()
    data = rep_res["data"]
    source = rep_res["source"]
    return {
        "title": data.get("report_title", "FactoryGPT Manufacturing Operations Report"),
        "generated_at": "Today 18:00 IST",
        "summary": "Plant operating at optimal efficiency with OEE exceeding benchmark targets.",
        "metrics": {
            "Total Production": 4850,
            "Target": 5000,
            "OEE": "86.4%",
            "Defect Count": 42,
            "Downtime Minutes": 45
        },
        "sections": [
            {
                "section": "Key Highlights",
                "content": data.get("key_highlights", [])
            }
        ],
        "source": source
    }

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    """WebSocket endpoint for real-time streaming responses."""
    await websocket.accept()
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                msg_json = json.loads(raw_data)
                user_msg = msg_json.get("message", raw_data)
                lang = msg_json.get("language", "en")
                role = msg_json.get("role", "Production Manager")
            except Exception:
                user_msg = raw_data
                lang = "en"
                role = "Production Manager"

            res = ask_assistant(message=user_msg, language=lang, role=role)
            await websocket.send_text(json.dumps(res))
    except WebSocketDisconnect:
        pass

@router.post("/notify")
def notify(payload: NotifyRequest):
    """Called by backend-core's workflow chain for Slack/Teams alerts."""
    message = f":rotating_light: Ticket #{payload.ticket_id}: {payload.description}"
    if NOTIFY_WEBHOOK_URL:
        try:
            httpx.post(NOTIFY_WEBHOOK_URL, json={"text": message}, timeout=3.0)
        except httpx.HTTPError:
            pass
    else:
        print(f"[notify] {message}")
    return {"status": "sent"}
