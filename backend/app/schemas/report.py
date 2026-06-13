from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ReportBase(BaseModel):
    title: str
    type: str = "comprehensive"

class ReportCreate(BaseModel):
    title: Optional[str] = None
    type: str = "comprehensive"

class ReportResponse(ReportBase):
    id: int
    user_id: int
    report_id: str
    scores: Optional[Dict[str, int]] = None
    business_overview: Optional[Dict[str, Any]] = None
    website_audit: Optional[Dict[str, Any]] = None
    seo_audit: Optional[Dict[str, Any]] = None
    social_media_analysis: Optional[Dict[str, Any]] = None
    marketing_strategy: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
