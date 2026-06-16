from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.auth import get_current_user, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.audit import WebsiteAuditRequest, WebsiteAuditResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audit", tags=["Website SEO Audit"])

@router.post("/", response_model=WebsiteAuditResponse, status_code=status.HTTP_201_CREATED)
def run_website_audit(
    audit_in: WebsiteAuditRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    try:
        return AuditService.run_audit(db=db, user_id=current_user.id, audit_in=audit_in)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during the audit: {str(e)}"
        )

@router.get("/", response_model=List[WebsiteAuditResponse])
def get_audit_history(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    return AuditService.get_user_audits(db=db, user_id=current_user.id)

@router.get("/{audit_id}", response_model=WebsiteAuditResponse)
def get_audit_report(
    audit_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):

    audit = AuditService.get_audit(db=db, audit_id=audit_id, user_id=current_user.id)
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit report not found."
        )
    return audit
