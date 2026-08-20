from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: str
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    country: str = "USA"
    price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    cap_rate: Optional[float] = None
    square_footage: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    status: str = "available"
    listing_type: str = "sale"
    features: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    country: Optional[str] = None
    price: Optional[float] = None
    price_per_sqft: Optional[float] = None
    cap_rate: Optional[float] = None
    square_footage: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    status: Optional[str] = None
    listing_type: Optional[str] = None
    features: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class PropertyResponse(PropertyBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True