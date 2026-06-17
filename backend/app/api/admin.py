from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from app.models.report import Report
from app.models.marketing_strategy import MarketingStrategy
from app.models.business import BusinessProfile
from app.models.subscription import Payment, Subscription, TrialHistory, PlanPrice
from app.services.access_service import AccessService
from app.core.security import get_password_hash
from app.schemas.user import User as UserSchema

class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    password: Optional[str] = None


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
    search: Optional[str] = None,
    role: Optional[str] = None,
    plan: Optional[str] = None,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    query = db.query(UserModel)
    
    if search:
        query = query.filter(
            (UserModel.full_name.ilike(f"%{search}%")) |
            (UserModel.email.ilike(f"%{search}%"))
        )
        
    if role:
        query = query.filter(UserModel.role == role)
        
    users = query.order_by(UserModel.created_at.desc()).all()
    user_list = []
    
    for u in users:
        # Business profiles
        profiles = db.query(BusinessProfile).filter(BusinessProfile.user_id == u.id).all()
        profile_data = [{
            "id": p.id,
            "business_name": p.business_name,
            "business_category": p.business_category,
            "website_url": p.website_url
        } for p in profiles]
        
        # Access details
        access = AccessService.get_access_status(db, u.id)
        
        # Filter by subscription plan name if specified
        if plan:
            sub_plan = access.get("subscription_plan") or ""
            if plan == "trial" and not access.get("trial_active"):
                continue
            elif plan != "trial" and plan.lower() not in sub_plan.lower():
                continue
                
        # Payments
        payments = db.query(Payment).filter(Payment.user_id == u.id).order_by(Payment.created_at.desc()).all()
        payment_list = [{
            "id": p.id,
            "amount": p.amount,
            "razorpay_order_id": p.razorpay_order_id,
            "razorpay_payment_id": p.razorpay_payment_id,
            "status": p.status,
            "created_at": p.created_at
        } for p in payments]
        
        audits_count = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == u.id).count()
        reports_count = db.query(Report).filter(Report.user_id == u.id).count()
        
        user_list.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "created_at": u.created_at,
            "audits_count": audits_count,
            "reports_count": reports_count,
            "business_profiles": profile_data,
            "access": access,
            "payments": payment_list
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

@router.get("/users/{user_id}", response_model=Dict[str, Any])
def preview_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    profiles = db.query(BusinessProfile).filter(BusinessProfile.user_id == user.id).all()
    profile_data = [{
        "id": p.id,
        "business_name": p.business_name,
        "business_category": p.business_category,
        "website_url": p.website_url,
        "industry_type": p.industry_type,
        "description": p.description,
        "email": p.email,
        "contact_number": p.contact_number,
        "city": p.city,
        "state": p.state,
        "country": p.country
    } for p in profiles]
    
    access = AccessService.get_access_status(db, user.id)
    
    payments = db.query(Payment).filter(Payment.user_id == user.id).order_by(Payment.created_at.desc()).all()
    payment_list = [{
        "id": p.id,
        "amount": p.amount,
        "razorpay_order_id": p.razorpay_order_id,
        "razorpay_payment_id": p.razorpay_payment_id,
        "status": p.status,
        "created_at": p.created_at
    } for p in payments]
    
    audits_count = db.query(WebsiteAudit).filter(WebsiteAudit.user_id == user.id).count()
    reports_count = db.query(Report).filter(Report.user_id == user.id).count()
    
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "created_at": user.created_at,
        "audits_count": audits_count,
        "reports_count": reports_count,
        "business_profiles": profile_data,
        "access": access,
        "payments": payment_list
    }

@router.put("/users/{user_id}", response_model=Dict[str, Any])
def update_user(
    user_id: int,
    body: AdminUserUpdate,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    if body.full_name is not None:
        user.full_name = body.full_name
    if body.email is not None:
        # Check if email is already taken by another user
        exist = db.query(UserModel).filter(UserModel.email == body.email, UserModel.id != user_id).first()
        if exist:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already taken by another account."
            )
        user.email = body.email
    if body.role is not None:
        if body.role not in ["user", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid role. Must be 'user' or 'admin'."
            )
        user.role = body.role
    if body.password is not None:
        if len(body.password) < 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters."
            )
        user.hashed_password = get_password_hash(body.password)
        
    db.commit()
    db.refresh(user)
    
    return {"id": user.id, "email": user.email, "full_name": user.full_name, "role": user.role, "detail": "User updated successfully."}


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

# ─── Plan Price Management ──────────────────────────────────────────────────

DEFAULT_PLANS = [
    {"plan_name": "15 Days",  "price": 299.0,  "duration_days": 15,  "description": "Perfect for quick audit reports and campaign testing."},
    {"plan_name": "1 Month",  "price": 499.0,  "duration_days": 30,  "description": "Standard monthly access to refine your marketing systems."},
    {"plan_name": "3 Months", "price": 1299.0, "duration_days": 90,  "description": "Medium-term plan for growing businesses and active audits."},
    {"plan_name": "6 Months", "price": 2299.0, "duration_days": 180, "description": "Semi-annual package for established marketing consultants."},
    {"plan_name": "1 Year",   "price": 3999.0, "duration_days": 365, "description": "Ultimate yearly pass with full executive privileges."},
]

class PlanPriceUpdate(BaseModel):
    plan_name: str
    price: float
    duration_days: int
    description: Optional[str] = None


@router.get("/plans", response_model=List[Dict[str, Any]])
def list_plans(
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    """List all subscription plans and their prices. Seeds defaults if empty."""
    plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    if not plans:
        # Seed defaults on first access
        for p in DEFAULT_PLANS:
            db.add(PlanPrice(**p))
        db.commit()
        plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    return [
        {
            "id": p.id,
            "plan_name": p.plan_name,
            "price": p.price,
            "duration_days": p.duration_days,
            "description": p.description,
            "updated_at": p.updated_at,
        }
        for p in plans
    ]


@router.put("/plans/{plan_id}", response_model=Dict[str, Any])
def update_plan(
    plan_id: int,
    body: PlanPriceUpdate,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    """Update the price / duration / description of a plan."""
    plan = db.query(PlanPrice).filter(PlanPrice.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found.")

    plan.plan_name    = body.plan_name
    plan.price        = body.price
    plan.duration_days= body.duration_days
    plan.description  = body.description
    plan.updated_at   = datetime.utcnow()
    db.commit()
    db.refresh(plan)
    return {
        "id": plan.id,
        "plan_name": plan.plan_name,
        "price": plan.price,
        "duration_days": plan.duration_days,
        "description": plan.description,
        "updated_at": plan.updated_at,
        "detail": "Plan updated successfully."
    }


@router.post("/plans", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_plan(
    body: PlanPriceUpdate,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    """Create a new subscription plan."""
    existing = db.query(PlanPrice).filter(PlanPrice.plan_name == body.plan_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A plan named '{body.plan_name}' already exists. Use PUT to update it."
        )
    new_plan = PlanPrice(
        plan_name=body.plan_name,
        price=body.price,
        duration_days=body.duration_days,
        description=body.description,
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    return {
        "id": new_plan.id,
        "plan_name": new_plan.plan_name,
        "price": new_plan.price,
        "duration_days": new_plan.duration_days,
        "description": new_plan.description,
        "updated_at": new_plan.updated_at,
        "detail": "Plan created successfully."
    }


@router.delete("/plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    """Delete a subscription plan."""
    db.delete(plan)
    db.commit()
    return None

import shutil
import os

@router.post("/platform-qr")
def upload_platform_qr(
    file: UploadFile = File(...),
    current_admin: UserModel = Depends(get_current_admin)
):
    """Upload the central UPI/QR code image for payments."""
    os.makedirs("uploads", exist_ok=True)
    filepath = os.path.join("uploads", "platform_qr.png")
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"success": True, "url": "/uploads/platform_qr.png"}

@router.get("/payments/pending")
def list_pending_payments(
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    payments = db.query(Payment).filter(Payment.status == "pending_verification").all()
    res = []
    for p in payments:
        u = db.query(UserModel).filter(UserModel.id == p.user_id).first()
        res.append({
            "id": p.id,
            "user_email": u.email if u else "Unknown",
            "amount": p.amount,
            "payment_proof": p.payment_proof,
            "created_at": p.created_at,
            "razorpay_order_id": p.razorpay_order_id
        })
    return res

@router.post("/payments/{payment_id}/approve")
def approve_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != "pending_verification":
        raise HTTPException(status_code=400, detail="Payment is not pending verification")

    payment.status = "success"
    
    # Activate subscription
    if payment.plan_name:
        from app.models.subscription import PlanPrice
        from app.services.access_service import AccessService
        plan = db.query(PlanPrice).filter(PlanPrice.plan_name == payment.plan_name).first()
        if plan:
            AccessService.process_payment_and_subscription(
                db=db,
                user_id=payment.user_id,
                plan_name=payment.plan_name,
                amount=payment.amount,
                razorpay_order_id=payment.razorpay_order_id,
                razorpay_payment_id="qr_manual_" + str(payment_id),
                razorpay_signature="qr_manual_approve",
                duration_days=plan.duration_days,
                skip_signature_verification=True
            )
            
    db.commit()
    return {"success": True, "detail": "Payment approved and subscription activated."}

@router.post("/payments/{payment_id}/reject")
def reject_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_admin: UserModel = Depends(get_current_admin)
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != "pending_verification":
        raise HTTPException(status_code=400, detail="Payment is not pending verification")

    payment.status = "failed"
    db.commit()
    return {"success": True, "detail": "Payment rejected."}

