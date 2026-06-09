from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class WebsiteAuditRequest(BaseModel):
    website_url: str = Field(..., description="The URL of the website to audit")

class WebsiteAuditResponse(BaseModel):
    id: int
    user_id: int
    website_url: str
    title: Optional[str] = None
    meta_description: Optional[str] = None
    h1_tags: Optional[List[str]] = None
    h2_tags: Optional[List[str]] = None
    image_alt_tags: Optional[Dict[str, Any]] = None
    is_https: bool
    internal_links: Optional[List[str]] = None
    images_count: int
    scripts_count: int
    stylesheets_count: int
    health_score: int
    seo_score: int
    audit_report: Optional[Dict[str, Any]] = None
    improvement_suggestions: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True
