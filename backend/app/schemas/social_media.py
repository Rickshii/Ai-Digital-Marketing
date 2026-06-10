from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SocialMediaAnalysisRequest(BaseModel):
    facebook_url: Optional[str] = Field(None, description="Facebook page URL")
    instagram_url: Optional[str] = Field(None, description="Instagram profile URL")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn page URL")
    youtube_url: Optional[str] = Field(None, description="YouTube channel URL")
    business_profile_id: Optional[int] = Field(None, description="Optional linked business profile")


class PlatformResult(BaseModel):
    platform: str
    url: Optional[str] = None
    reachable: bool = False
    profile_found: bool = False
    has_bio: bool = False
    has_contact: bool = False
    has_website_link: bool = False
    has_recent_activity: bool = False
    posting_frequency: Optional[str] = None
    followers: Optional[str] = None
    following: Optional[str] = None
    posts_count: Optional[str] = None
    profile_picture: bool = False
    completeness_score: int = 0
    issues: List[str] = []
    strengths: List[str] = []


class SocialMediaAnalysisResponse(BaseModel):
    id: int
    user_id: int
    business_profile_id: Optional[int] = None

    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    youtube_url: Optional[str] = None

    facebook_analysis: Optional[Dict[str, Any]] = None
    instagram_analysis: Optional[Dict[str, Any]] = None
    linkedin_analysis: Optional[Dict[str, Any]] = None
    youtube_analysis: Optional[Dict[str, Any]] = None

    platforms_found: int = 0
    platforms_analyzed: int = 0

    social_score: int = 0
    profile_completeness: int = 0

    missing_elements: Optional[List[str]] = None
    growth_suggestions: Optional[List[str]] = None
    analysis_summary: Optional[Dict[str, Any]] = None

    created_at: datetime

    class Config:
        from_attributes = True


# ── Extended SEO Audit schema (adds extra detail fields) ──────────────────────

class SEOAuditRequest(BaseModel):
    website_url: str = Field(..., description="The URL to perform the full SEO audit on")


class SEOAuditResponse(BaseModel):
    id: int
    user_id: int
    website_url: str

    # Basic meta
    title: Optional[str] = None
    meta_description: Optional[str] = None

    # Structure
    h1_tags: Optional[List[str]] = None
    h2_tags: Optional[List[str]] = None
    h3_tags: Optional[List[str]] = None

    # Images
    image_alt_tags: Optional[Dict[str, Any]] = None
    images_count: int = 0

    # Technical
    is_https: bool = False
    has_robots_txt: bool = False
    has_sitemap: bool = False
    has_canonical: bool = False
    canonical_url: Optional[str] = None

    # Links & assets
    internal_links: Optional[List[str]] = None
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
