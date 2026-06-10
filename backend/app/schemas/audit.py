from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class WebsiteAuditRequest(BaseModel):
    website_url: str = Field(..., description="The URL of the website to audit")


class WebsiteAuditResponse(BaseModel):
    id: int
    user_id: int
    website_url: str

    # On-page
    title: Optional[str] = None
    meta_description: Optional[str] = None
    h1_tags: Optional[List[str]] = None
    h2_tags: Optional[List[str]] = None
    h3_tags: Optional[List[str]] = None
    image_alt_tags: Optional[Dict[str, Any]] = None
    images_count: int = 0

    # Technical
    is_https: bool = False
    has_robots_txt: bool = False
    has_sitemap: bool = False
    has_canonical: bool = False
    canonical_url: Optional[str] = None
    internal_links: Optional[List[str]] = None

    # Assets
    scripts_count: int = 0
    stylesheets_count: int = 0

    # Content
    word_count: int = 0
    readability_score: Optional[float] = None
    readability_grade: Optional[str] = None
    keyword_density: Optional[Dict[str, Any]] = None

    # Scores
    health_score: int = 0
    seo_score: int = 0

    # Reports
    audit_report: Optional[Dict[str, Any]] = None
    improvement_suggestions: Optional[List[str]] = None
    seo_errors: Optional[List[Dict[str, Any]]] = None

    created_at: datetime

    class Config:
        from_attributes = True
