from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    
    # Basic Info
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    property_type = Column(String(50), nullable=False)  # office, industrial, retail, multifamily, land, etc.
    
    # Location
    address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False, index=True)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=True)
    country = Column(String(50), default="USA")
    
    # Financials
    price = Column(Float, nullable=True)               # Sale price
    price_per_sqft = Column(Float, nullable=True)
    cap_rate = Column(Float, nullable=True)
    
    # Physical
    square_footage = Column(Float, nullable=True)
    lot_size = Column(Float, nullable=True)
    year_built = Column(Integer, nullable=True)
    
    # Status
    status = Column(String(30), default="available")   # available, under_contract, sold, leased
    listing_type = Column(String(20), default="sale")  # sale / lease
    
    # Extra
    features = Column(Text, nullable=True)             # JSON string or comma separated
    image_url = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())