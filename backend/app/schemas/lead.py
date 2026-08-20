from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class LeadBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    score: int = 0
    status: str = "new"
    interested_property_type: Optional[str] = None
    interested_city: Optional[str] = None
    budget: Optional[float] = None
    notes: Optional[str] = None
    source: str = "chat"

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    score: Optional[int] = None
    status: Optional[str] = None
    interested_property_type: Optional[str] = None
    interested_city: Optional[str] = None
    budget: Optional[float] = None
    notes: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
