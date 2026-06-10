from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class WebsiteAudit(Base):
    __tablename__ = "website_audits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    website_url = Column(String, nullable=False)

    # ── On-page SEO ────────────────────────────────────────────────────────────
    title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    h1_tags = Column(JSON, nullable=True)           # List[str]
    h2_tags = Column(JSON, nullable=True)           # List[str]
    h3_tags = Column(JSON, nullable=True)           # List[str]
    image_alt_tags = Column(JSON, nullable=True)    # {"total": int, "missing_alt": int}
    images_count = Column(Integer, default=0)

    # ── Technical SEO ──────────────────────────────────────────────────────────
    is_https = Column(Boolean, default=False)
    has_robots_txt = Column(Boolean, default=False)
    has_sitemap = Column(Boolean, default=False)
    has_canonical = Column(Boolean, default=False)
    canonical_url = Column(String, nullable=True)
    internal_links = Column(JSON, nullable=True)    # List[str]

    # ── Assets ─────────────────────────────────────────────────────────────────
    scripts_count = Column(Integer, default=0)
    stylesheets_count = Column(Integer, default=0)

    # ── Content quality ────────────────────────────────────────────────────────
    word_count = Column(Integer, default=0)
    readability_score = Column(Float, nullable=True)   # Flesch Reading Ease 0-100
    readability_grade = Column(String, nullable=True)  # e.g. "Easy", "Standard", "Difficult"
    keyword_density = Column(JSON, nullable=True)      # {"word": count, ...} top 10

    # ── Scores ────────────────────────────────────────────────────────────────
    health_score = Column(Integer, default=0)
    seo_score = Column(Integer, default=0)

    # ── Reports ───────────────────────────────────────────────────────────────
    audit_report = Column(JSON, nullable=True)           # Structured breakdown
    improvement_suggestions = Column(JSON, nullable=True)  # List[str]
    seo_errors = Column(JSON, nullable=True)               # List[{level, message}]

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="website_audits")
