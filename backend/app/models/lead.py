from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(100), nullable=True)
    email = Column(String(150), nullable=True)
    phone = Column(String(50), nullable=True)
    
    # Scoring
    score = Column(Integer, default=0)                # 0 - 100
    status = Column(String(30), default="new")        # new, contacted, qualified, lost
    
    # Interest
    interested_property_type = Column(String(50), nullable=True)
    interested_city = Column(String(100), nullable=True)
    budget = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Source
    source = Column(String(50), default="chat")       # chat, website, manual
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
