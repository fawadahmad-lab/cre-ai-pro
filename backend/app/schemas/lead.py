from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LeadBase(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    property_type: Optional[str] = None
    budget: Optional[float] = None
    status: str = "new"
    source: str = "chat"
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    property_type: Optional[str] = None
    budget: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(LeadBase):
    id: int
    conversation_id: Optional[str] = None
    score: int
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
