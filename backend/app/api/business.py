from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.business import BusinessProfileCreate, BusinessProfileUpdate, BusinessProfileResponse
from app.services.business_service import BusinessService

router = APIRouter(prefix="/business", tags=["Business Profile Analysis"])

@router.post("/", response_model=BusinessProfileResponse, status_code=status.HTTP_201_CREATED)
def create_business_profile(
    profile_in: BusinessProfileCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    return BusinessService.create_profile(db=db, user_id=current_user.id, profile_in=profile_in)

@router.get("/", response_model=List[BusinessProfileResponse])
def get_business_profiles(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    return BusinessService.get_user_profiles(db=db, user_id=current_user.id)

@router.get("/{profile_id}", response_model=BusinessProfileResponse)
def get_business_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    profile = BusinessService.get_profile(db=db, profile_id=profile_id, user_id=current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found."
        )
    return profile

@router.put("/{profile_id}", response_model=BusinessProfileResponse)
def update_business_profile(
    profile_id: int,
    profile_in: BusinessProfileUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    profile = BusinessService.update_profile(
        db=db, profile_id=profile_id, user_id=current_user.id, profile_in=profile_in
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found or unauthorized."
        )
    return profile

@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business_profile(
    profile_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):

    success = BusinessService.delete_profile(db=db, profile_id=profile_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found or unauthorized."
        )
    return None
