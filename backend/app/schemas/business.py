from pydantic import BaseModel, HttpUrl, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class BusinessProfileBase(BaseModel):
    business_name: str = Field(..., min_length=1, max_length=100)
    industry_type: str = Field(..., min_length=1, max_length=100)
    website_url: Optional[str] = None
    business_location: Optional[str] = None
    target_audience: Optional[str] = None
    description: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    social_media_links: Optional[Dict[str, str]] = None

class BusinessProfileCreate(BusinessProfileBase):
    pass

class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    industry_type: Optional[str] = None
    website_url: Optional[str] = None
    business_location: Optional[str] = None
    target_audience: Optional[str] = None
    description: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[EmailStr] = None
    social_media_links: Optional[Dict[str, str]] = None

class BusinessProfileResponse(BusinessProfileBase):
    id: int
    user_id: int
    completeness_score: int
    missing_info_report: List[str]
    improvement_suggestions: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
