from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    website_url = Column(String, nullable=False)
    
    # Audit Results
    title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    h1_tags = Column(JSON, nullable=True) # List of H1 tag contents
    h2_tags = Column(JSON, nullable=True) # List of H2 tag contents
    image_alt_tags = Column(JSON, nullable=True) # Dict: {"total": int, "missing_alt": int}
    is_https = Column(Boolean, default=False)
    internal_links = Column(JSON, nullable=True) # List of urls
    images_count = Column(Integer, default=0)
    scripts_count = Column(Integer, default=0)
    stylesheets_count = Column(Integer, default=0)
    
    # Scores
    health_score = Column(Integer, default=0)
    seo_score = Column(Integer, default=0)
    
    # Reports
    audit_report = Column(JSON, nullable=True) # JSON summary breakdown
    improvement_suggestions = Column(JSON, nullable=True) # List of suggestions
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="website_audits")
