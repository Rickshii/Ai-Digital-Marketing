from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class BusinessProfile(Base):
    __tablename__ = "business_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_name = Column(String, nullable=False)
    industry_type = Column(String, nullable=False)
    website_url = Column(String, nullable=True)
    business_location = Column(String, nullable=True)
    target_audience = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    social_media_links = Column(JSON, nullable=True) # Dict of platform -> url
    
    # New fields from multi-step registration
    business_category = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    google_profile_registered = Column(String, nullable=True) # 'Yes' or 'No'
    google_maps_link = Column(String, nullable=True)
    number_of_branches = Column(Integer, default=0, nullable=True)
    branch_locations = Column(Text, nullable=True)
    whatsapp_number = Column(String, nullable=True)
    
    # Calculated metrics
    completeness_score = Column(Integer, default=0)
    missing_info_report = Column(JSON, nullable=True) # List of missing items
    improvement_suggestions = Column(JSON, nullable=True) # List of suggestions
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="business_profiles")
