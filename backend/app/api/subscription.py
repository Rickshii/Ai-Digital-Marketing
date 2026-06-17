from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
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

    if not razorpay_key_id or not razorpay_key_secret or razorpay_key_id == "dummy_key":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Razorpay credentials are not configured on the server."
        )

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
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Razorpay order: {str(e)}"
        )


@router.post("/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Verifies the Razorpay payment signature and activates the subscription.
    
    The plan is ONLY activated after Razorpay's HMAC-SHA256 signature is validated.
    """
    # Resolve the plan from DB to get the canonical duration_days
    plans = _get_plans_map(db)
    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{body.plan_name}'.",
        )
    duration_days = plans[body.plan_name]["duration_days"]

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
        duration_days=duration_days,
    )

    if not result["success"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result["detail"])

    return {
        "success": True,
        "detail": result["detail"],
        "plan_name": result.get("plan_name"),
        "expiry_date": result.get("expiry_date"),
        "duration_days": result.get("duration_days"),
    }

@router.post("/qr-payment")
def submit_qr_payment(
    plan_name: str = Form(...),
    razorpay_order_id: str = Form(...),
    screenshot: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Submits a QR payment screenshot for manual verification."""
    plans = _get_plans_map(db)
    if plan_name not in plans:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan = plans[plan_name]
    amount = plan["price"]

    import shutil
    import uuid
    os.makedirs("uploads", exist_ok=True)
    ext = screenshot.filename.split(".")[-1] if "." in screenshot.filename else "png"
    filename = f"qr_{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(screenshot.file, buffer)

    from app.models.subscription import Payment
    payment = Payment(
        user_id=current_user.id,
        amount=amount,
        currency="INR",
        razorpay_order_id=razorpay_order_id,
        payment_method="qr",
        payment_proof=f"/uploads/{filename}",
        plan_name=plan_name,
        status="pending_verification"
    )
    db.add(payment)
    db.commit()

    return {"success": True, "detail": "Payment submitted for verification."}

