from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class MarketingStrategyBase(BaseModel):
    business_profile_id: Optional[int] = None

class MarketingStrategyCreate(MarketingStrategyBase):
    pass

class MarketingStrategyResponse(MarketingStrategyBase):
    id: int
    user_id: int
    strategy_score: int
    active_tasks: str
    reach_estimate: str
    projected_roi: str
    scores_used: Optional[Dict[str, Any]] = None
    plan_30_day: Optional[List[Dict[str, Any]]] = None
    plan_90_day: Optional[List[Dict[str, Any]]] = None
    branding_strategy: Optional[Dict[str, Any]] = None
    lead_gen_strategy: Optional[Dict[str, Any]] = None
    content_strategy: Optional[Dict[str, Any]] = None
    social_media_strategy: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True
