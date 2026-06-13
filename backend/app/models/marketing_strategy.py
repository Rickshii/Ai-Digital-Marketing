from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class MarketingStrategy(Base):
    __tablename__ = "marketing_strategies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    business_profile_id = Column(Integer, ForeignKey("business_profiles.id", ondelete="SET NULL"), nullable=True)
    
    # Overview metrics
    strategy_score = Column(Integer, default=0)
    active_tasks = Column(String, default="0/0")
    reach_estimate = Column(String, default="Unknown")
    projected_roi = Column(String, default="Unknown")
    
    # Scoring inputs used to generate this strategy
    scores_used = Column(JSON, nullable=True) # {business_score, website_health, seo_score, social_score}
    
    # Detailed strategies
    plan_30_day = Column(JSON, nullable=True)       # Week-by-week tasks
    plan_90_day = Column(JSON, nullable=True)       # Month 2, Month 3, Ongoing
    branding_strategy = Column(JSON, nullable=True) # Brand voice, identity, positioning
    lead_gen_strategy = Column(JSON, nullable=True) # Lead magnets, conversion tactics
    content_strategy = Column(JSON, nullable=True)  # Pillars, calendar snapshot
    social_media_strategy = Column(JSON, nullable=True) # Channel mix, budgets, post schedules
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    business_profile = relationship("BusinessProfile")
