from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from app.schemas.property import PropertyResponse


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None  # client-generated UUID per visitor session


class ChatResponse(BaseModel):
    reply: str
    conversation_id: str
    properties: List[PropertyResponse] = []  # real inventory cards to render in the UI
    lead_id: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ConversationResponse(BaseModel):
    id: str
    lead_id: Optional[int] = None
    title: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []
