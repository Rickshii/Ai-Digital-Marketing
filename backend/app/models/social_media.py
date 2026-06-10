from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class SocialMediaAnalysis(Base):
    __tablename__ = "social_media_analyses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id", ondelete="SET NULL"), nullable=True)

    # Input social links analyzed
    facebook_url = Column(String, nullable=True)
    instagram_url = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    youtube_url = Column(String, nullable=True)

    # Platform-level analysis results (JSON per platform)
    facebook_analysis = Column(JSON, nullable=True)
    instagram_analysis = Column(JSON, nullable=True)
    linkedin_analysis = Column(JSON, nullable=True)
    youtube_analysis = Column(JSON, nullable=True)

    # Aggregate results
    platforms_found = Column(Integer, default=0)
    platforms_analyzed = Column(Integer, default=0)

    # Scores
    social_score = Column(Integer, default=0)      # 0-100 overall score
    profile_completeness = Column(Integer, default=0)  # 0-100

    # Reports
    missing_elements = Column(JSON, nullable=True)    # List of missing items
    growth_suggestions = Column(JSON, nullable=True)  # List of suggestions
    analysis_summary = Column(JSON, nullable=True)    # Summary breakdown

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="social_media_analyses")
