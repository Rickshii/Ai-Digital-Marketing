from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.social_media import SocialMediaAnalysisRequest, SocialMediaAnalysisResponse
from app.services.social_media_service import SocialMediaService

router = APIRouter(prefix="/social", tags=["Social Media Analysis"])


@router.post(
    "/",
    response_model=SocialMediaAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run a social media analysis for the provided platform URLs",
)
def run_social_analysis(
    analysis_in: SocialMediaAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    try:
        return SocialMediaService.run_analysis(
            db=db, user_id=current_user.id, analysis_in=analysis_in
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during the social media analysis: {str(e)}",
        )


@router.get(
    "/",
    response_model=List[SocialMediaAnalysisResponse],
    summary="Retrieve all social media analysis results for the current user",
)
def get_social_analysis_history(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    return SocialMediaService.get_user_analyses(db=db, user_id=current_user.id)


@router.get(
    "/{analysis_id}",
    response_model=SocialMediaAnalysisResponse,
    summary="Get a specific social media analysis result by ID",
)
def get_social_analysis_report(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    analysis = SocialMediaService.get_analysis(
        db=db, analysis_id=analysis_id, user_id=current_user.id
    )
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Social media analysis report not found.",
        )
    return analysis
