from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(255), nullable=False, index=True)
    property_type = Column(String(50), nullable=False)  # plot, house, apartment, shop, office

    city = Column(String(100), nullable=False, index=True)  # Karachi, Lahore, Islamabad...
    area = Column(String(150), nullable=False)  # DHA Phase 6, Bahria Town, Gulberg...

    size = Column(Float, nullable=False)
    size_unit = Column(String(20), default="Marla")  # Marla, Kanal, Sqft, Sq. Yard

    price = Column(Float, nullable=False)  # in PKR
    price_type = Column(String(20), default="total")  # total, per_marla, per_sqft

    listing_type = Column(String(20), default="sale")  # sale / rent
    status = Column(String(30), default="available")  # available, sold, rented, reserved

    description = Column(Text, nullable=True)
    features = Column(Text, nullable=True)  # comma separated
    image_url = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
