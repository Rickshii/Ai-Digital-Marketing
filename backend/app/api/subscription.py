from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import uuid

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.subscription import PlanPrice
from app.services.access_service import AccessService

router = APIRouter(prefix="/subscription", tags=["Subscription and Payments"])

# ── Default prices used when plan_prices table is empty ─────────────────────
DEFAULT_PLANS = {
    "15 Days":  {"price": 299.0,  "duration_days": 15},
    "1 Month":  {"price": 499.0,  "duration_days": 30},
    "3 Months": {"price": 1299.0, "duration_days": 90},
    "6 Months": {"price": 2299.0, "duration_days": 180},
    "1 Year":   {"price": 3999.0, "duration_days": 365},
}

def _get_plans_map(db: Session) -> Dict[str, Dict]:
    """Returns {plan_name: {price, duration_days}} from DB, falling back to defaults."""
    db_plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    if db_plans:
        return {p.plan_name: {"price": p.price, "duration_days": p.duration_days} for p in db_plans}
    return DEFAULT_PLANS


class CreateOrderRequest(BaseModel):
    plan_name: str


class VerifyPaymentRequest(BaseModel):
    plan_name: str
    amount: float
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── Public endpoint: no auth required, used by the subscription page ─────────
@router.get("/plans", response_model=List[Dict[str, Any]])
def list_public_plans(db: Session = Depends(get_db)):
    """Returns all available subscription plans with their current prices."""
    db_plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    if db_plans:
        return [
            {
                "id": p.id,
                "plan_name": p.plan_name,
                "price": p.price,
                "duration_days": p.duration_days,
                "description": p.description,
            }
            for p in db_plans
        ]
    # Fallback to hard-coded defaults
    return [
        {"id": i + 1, "plan_name": k, "price": v["price"], "duration_days": v["duration_days"], "description": ""}
        for i, (k, v) in enumerate(DEFAULT_PLANS.items())
    ]


@router.get("/status")
def get_status(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Retrieves the access status and trial/subscription details for the current user."""
    AccessService.log_access(db, current_user.id, "check_status")
    return AccessService.get_access_status(db, current_user.id)


@router.post("/create-order")
def create_order(
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Creates a Razorpay order (or mock order) for the selected plan."""
    plans = _get_plans_map(db)

    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{body.plan_name}'. Available plans: {list(plans.keys())}",
        )

    plan = plans[body.plan_name]
    amount_in_paise = int(plan["price"] * 100)

    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID", "")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")

    if razorpay_key_id and razorpay_key_secret and razorpay_key_id != "dummy_key":
        try:
            import razorpay
            client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"rcpt_{current_user.id}_{uuid.uuid4().hex[:8]}",
                "notes": {"user_id": current_user.id, "plan_name": body.plan_name},
            }
            order = client.order.create(data=order_data)
            return {
                "success": True,
                "order_id": order["id"],
                "amount": plan["price"],
                "currency": "INR",
                "key_id": razorpay_key_id,
                "is_mock": False,
            }
        except Exception:
            pass  # Fall through to mock

    # Mock payment fallback
    return {
        "success": True,
        "order_id": f"mock_order_{uuid.uuid4().hex[:12]}",
        "amount": plan["price"],
        "currency": "INR",
        "key_id": "dummy_key",
        "is_mock": True,
    }


@router.post("/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Verifies the Razorpay payment and activates the subscription."""
    # Validate plan still exists in DB
    plans = _get_plans_map(db)
    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan name.",
        )

    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret")

    result = AccessService.process_payment_and_subscription(
        db=db,
        user_id=current_user.id,
        plan_name=body.plan_name,
        amount=body.amount,
        razorpay_order_id=body.razorpay_order_id,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_signature=body.razorpay_signature,
        secret=razorpay_key_secret,
    )

    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["detail"])

    return {"success": True, "detail": "Subscription activated successfully."}
