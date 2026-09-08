from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PropertyBase(BaseModel):
    title: str
    property_type: str  # plot, house, apartment, shop, office
    city: str
    area: str
    size: float = Field(gt=0)
    size_unit: str = "Marla"
    price: float = Field(ge=0)
    price_type: str = "total"  # total, per_marla, per_sqft
    listing_type: str = "sale"  # sale / rent
    status: str = "available"
    description: Optional[str] = None
    features: Optional[str] = None
    image_url: Optional[str] = None


class PropertyCreate(PropertyBase):
    pass


class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    property_type: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    size: Optional[float] = None
    size_unit: Optional[str] = None
    price: Optional[float] = None
    price_type: Optional[str] = None
    listing_type: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    features: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class PropertyResponse(PropertyBase):
    id: int
    is_active: bool
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
