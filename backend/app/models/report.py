from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import random
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    report_id = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    type = Column(String, default="comprehensive") # 'comprehensive', 'audit', 'seo', 'social', 'strategy'
    
    # Save the consolidated scores
    scores = Column(JSON, nullable=True) # {business: int, health: int, seo: int, social: int, marketing: int}
    
    # Snapshot of the data at the time of report generation
    business_overview = Column(JSON, nullable=True)
    website_audit = Column(JSON, nullable=True)
    seo_audit = Column(JSON, nullable=True)
    social_media_analysis = Column(JSON, nullable=True)
    marketing_strategy = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")

    @staticmethod
    def generate_report_id():
        return f"REP-{random.randint(100000, 999999)}"
