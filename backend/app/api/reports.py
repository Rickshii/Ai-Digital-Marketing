from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.schemas.report import ReportResponse, ReportCreate
from app.services.report_service import ReportService

router = APIRouter(prefix="/reports", tags=["Consolidated PDF Reports"])

@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def generate_report(
    report_in: ReportCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    try:
        return ReportService.generate_report(db=db, user_id=current_user.id, report_in=report_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate report: {str(e)}"
        )

@router.get("/", response_model=List[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    return ReportService.get_user_reports(db=db, user_id=current_user.id)

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    report = ReportService.get_report(db=db, report_id=report_id, user_id=current_user.id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    return report

@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    success = ReportService.delete_report(db=db, report_id=report_id, user_id=current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found or unauthorized."
        )
    return None
