from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingBase(BaseModel):
    property_id: int = Field(gt=0)
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    scheduled_at: datetime
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    lead_id: Optional[int] = None
    conversation_id: Optional[str] = None


class BookingUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    status: Optional[str] = None  # pending, confirmed, completed, cancelled
    notes: Optional[str] = None


class BookingResponse(BookingBase):
    id: int
    lead_id: Optional[int] = None
    conversation_id: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class BookingDetailResponse(BookingResponse):
    property_title: Optional[str] = None
    property_city: Optional[str] = None
    property_area: Optional[str] = None
