"""Owner: Gauri."""
from pydantic import BaseModel
from typing import Optional


class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"   # "en" | "hi"


class ChatResponse(BaseModel):
    reply: str


class NotifyRequest(BaseModel):
    ticket_id: int
    description: str
