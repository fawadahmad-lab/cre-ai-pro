from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from sqlalchemy.sql import func

from app.db.base import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(String(100), nullable=True, index=True)

    name = Column(String(100), nullable=True)
    phone = Column(String(30), nullable=True)  # e.g. 03xx-xxxxxxx / +92xxxxxxxxxx
    email = Column(String(150), nullable=True)

    city = Column(String(100), nullable=True)  # Karachi, Lahore, Islamabad...
    property_type = Column(String(50), nullable=True)  # plot, house, apartment, shop, office
    budget = Column(Float, nullable=True)  # in PKR

    status = Column(String(30), default="new")  # new, contacted, qualified, viewing_scheduled, converted, lost
    score = Column(Integer, default=0)  # 0 - 100
    source = Column(String(50), default="chat")  # chat, website, manual
    notes = Column(Text, nullable=True)

    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
