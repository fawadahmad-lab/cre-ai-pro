from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func

from app.db.base import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True, index=True)
    conversation_id = Column(String(100), nullable=True)

    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(30), nullable=True)

    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(30), default="pending")  # pending, confirmed, completed, cancelled
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
