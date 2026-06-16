from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.marketing_strategy import MarketingStrategyResponse, MarketingStrategyCreate
from app.services.marketing_strategy_service import MarketingStrategyService

router = APIRouter(prefix="/strategy", tags=["Marketing Strategy Generator"])

@router.post("/", response_model=MarketingStrategyResponse, status_code=status.HTTP_201_CREATED)
def generate_strategy(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    try:
        return MarketingStrategyService.generate_strategy(db=db, user_id=current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate strategy: {str(e)}"
        )

@router.get("/latest", response_model=MarketingStrategyResponse)
def get_latest_strategy(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    strategy = MarketingStrategyService.get_latest_strategy(db=db, user_id=current_user.id)
    if not strategy:
        # If no strategy exists, auto-generate one for the user
        try:
            return MarketingStrategyService.generate_strategy(db=db, user_id=current_user.id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No strategy found and could not generate one."
            )
    return strategy

@router.get("/", response_model=List[MarketingStrategyResponse])
def get_strategy_history(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):

    return MarketingStrategyService.get_strategy_history(db=db, user_id=current_user.id)
