from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="user") # 'admin' or 'user'
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    business_profiles = relationship("BusinessProfile", back_populates="user", cascade="all, delete-orphan")
    website_audits = relationship("WebsiteAudit", back_populates="user", cascade="all, delete-orphan")
    social_media_analyses = relationship("SocialMediaAnalysis", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    trial_histories = relationship("TrialHistory", back_populates="user", cascade="all, delete-orphan")
    access_logs = relationship("UserAccessLog", back_populates="user", cascade="all, delete-orphan")

