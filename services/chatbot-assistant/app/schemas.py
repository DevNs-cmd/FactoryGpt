from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"   # "en" | "hi"
    user_id: Optional[str] = "user-001"
    role: Optional[str] = "Production Manager"
    department: Optional[str] = "Operations"

class ChatResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    answer: str
    reply: str  # Legacy field compatibility
    source: str
    confidence: float
    suggestions: List[str]
    execution_time_ms: Optional[float] = 0.0
    model_used: Optional[str] = "claude-3-5-sonnet-20241022"

class VoiceResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    transcription: str
    response: ChatResponse

class ChatHistoryItem(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    id: int
    user_id: str
    role: str
    department: str
    message: str
    language: str
    answer: str
    source: str
    confidence: float
    suggestions: List[str]
    execution_time_ms: float
    model_used: str
    api_cost: float
    timestamp: str

class ReportResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    title: str
    generated_at: str
    summary: str
    metrics: Dict[str, Any]
    sections: List[Dict[str, Any]]
    source: str

class NotifyRequest(BaseModel):
    ticket_id: int
    description: str

class TokenRequest(BaseModel):
    user_id: str
    role: str = "Production Manager"
    department: str = "Production"
