from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from app.models.report import Report
from app.models.marketing_strategy import MarketingStrategy
from app.schemas.user import User as UserSchema

router = APIRouter(prefix="/admin", tags=["Admin Dashboard Tools"])

def get_current_admin(current_user: UserModel = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges."
        )
    return current_user

@router.get("/stats", response_model=Dict[str, Any])
def get_admin_stats(
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    # Total Users
    total_users = db.query(UserModel).count()
    
    # Active Users (for simplicity, users who have created an audit/profile or registered recently)
    active_users = db.query(UserModel).filter(UserModel.created_at >= datetime.utcnow() - timedelta(days=30)).count()
    
    # New Registrations (last 7 days)
    new_registrations = db.query(UserModel).filter(UserModel.created_at >= datetime.utcnow() - timedelta(days=7)).count()
    
    # Total Audits
    website_audits_count = db.query(WebsiteAudit).count()
    social_audits_count = db.query(SocialMediaAnalysis).count()
    total_audits = website_audits_count + social_audits_count
    
    # Total Reports
    total_reports = db.query(Report).count()
    
    # Average score values (if present)
    avg_seo = db.query(func.avg(WebsiteAudit.seo_score)).scalar() or 0.0
    avg_health = db.query(func.avg(WebsiteAudit.health_score)).scalar() or 0.0
    avg_social = db.query(func.avg(SocialMediaAnalysis.social_score)).scalar() or 0.0
    
    # Activity over time (last 6 months)
    # We can compile registration trends
    now = datetime.utcnow()
    months_stats = []
    for i in range(5, -1, -1):
        start_date = (now - timedelta(days=30*(i+1)))
        end_date = (now - timedelta(days=30*i))
        count = db.query(UserModel).filter(UserModel.created_at >= start_date, UserModel.created_at < end_date).count()
        months_stats.append({
            "month": start_date.strftime("%b"),
            "count": count
        })

    return {
        "total_users": total_users,
        "active_users": max(1, active_users),
        "new_registrations": new_registrations,
        "total_audits": total_audits,
        "seo_audits": website_audits_count,
        "website_audits": website_audits_count, # same as website audit table count
        "social_media_audits": social_audits_count,
        "total_reports": total_reports,
        "avg_seo_score": round(float(avg_seo), 1),
        "avg_health_score": round(float(avg_health), 1),
        "avg_social_score": round(float(avg_social), 1),
        "registration_history": months_stats
    }

@router.get("/users", response_model=List[Dict[str, Any]])
def list_users(
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    users = db.query(UserModel).order_by(UserModel.created_at.desc()).all()
    user_list = []
    for u in users:
        audits_count = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == u.id).count()
        reports_count = db.query(Report).filter(Report.user_id == u.id).count()
        user_list.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at,
            "audits_count": audits_count,
            "reports_count": reports_count
        })
    return user_list

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself."
        )
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    db.delete(user)
    db.commit()
    return None

@router.get("/reports", response_model=List[Dict[str, Any]])
def list_all_reports(
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    reports_list = []
    for r in reports:
        owner = db.query(UserModel).filter(UserModel.id == r.user_id).first()
        reports_list.append({
            "id": r.id,
            "report_id": r.report_id,
            "title": r.title,
            "type": r.type,
            "created_at": r.created_at,
            "scores": r.scores,
            "user_email": owner.email if owner else "Unknown User"
        })
    return reports_list

@router.delete("/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found."
        )
    db.delete(report)
    db.commit()
    return None
