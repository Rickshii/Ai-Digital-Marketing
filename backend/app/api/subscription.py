from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
import os
import uuid

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.services.access_service import AccessService

router = APIRouter(prefix="/subscription", tags=["Subscription and Payments"])

class CreateOrderRequest(BaseModel):
    plan_name: str  # "15 Days", "1 Month", "3 Months", "6 Months", "1 Year"

class VerifyPaymentRequest(BaseModel):
    plan_name: str
    amount: float
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.get("/status")
def get_status(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Retrieves the access status and trial/subscription remaining details for the current user."""
    # Log access for user
    AccessService.log_access(db, current_user.id, "check_status")
    return AccessService.get_access_status(db, current_user.id)

@router.post("/create-order")
def create_order(
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Creates a Razorpay Order for the selected plan."""
    plans = {
        "15 Days": {"price": 299.0, "days": 15},
        "1 Month": {"price": 499.0, "days": 30},
        "3 Months": {"price": 1299.0, "days": 90},
        "6 Months": {"price": 2299.0, "days": 180},
        "1 Year": {"price": 3999.0, "days": 365}
    }
    
    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan name selected."
        )
        
    plan = plans[body.plan_name]
    amount_in_paise = int(plan["price"] * 100)
    
    # Try importing razorpay and generating a real order
    razorpay_key_id = os.getenv("RAZORPAY_KEY_ID")
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    
    if razorpay_key_id and razorpay_key_secret and razorpay_key_id != "dummy_key":
        try:
            import razorpay
            client = razorpay.Client(auth=(razorpay_key_id, razorpay_key_secret))
            order_data = {
                "amount": amount_in_paise,
                "currency": "INR",
                "receipt": f"receipt_{current_user.id}_{str(uuid.uuid4())[:8]}",
                "notes": {
                    "user_id": current_user.id,
                    "plan_name": body.plan_name
                }
            }
            order = client.order.create(data=order_data)
            return {
                "success": True,
                "order_id": order["id"],
                "amount": plan["price"],
                "currency": "INR",
                "key_id": razorpay_key_id,
                "is_mock": False
            }
        except Exception as e:
            # Fallback to mock order if Razorpay client fails (e.g. invalid keys, timeout)
            pass

    # Mock payment fallback flow
    mock_order_id = f"mock_order_{uuid.uuid4().hex[:12]}"
    return {
        "success": True,
        "order_id": mock_order_id,
        "amount": plan["price"],
        "currency": "INR",
        "key_id": "dummy_key",
        "is_mock": True
    }

@router.post("/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """Verifies the payment and updates subscription state."""
    razorpay_key_secret = os.getenv("RAZORPAY_KEY_SECRET", "dummy_secret")
    
    result = AccessService.process_payment_and_subscription(
        db=db,
        user_id=current_user.id,
        plan_name=body.plan_name,
        amount=body.amount,
        razorpay_order_id=body.razorpay_order_id,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_signature=body.razorpay_signature,
        secret=razorpay_key_secret
    )
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["detail"]
        )
        
    return {"success": True, "detail": "Subscription activated successfully."}
