from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import os
import uuid
import hmac
import hashlib

from app.core.database import get_db
from app.api.auth import get_current_user
from app.models.user import User as UserModel
from app.models.subscription import PlanPrice, PlatformSettings
from app.services.access_service import AccessService

router = APIRouter(prefix="/subscription", tags=["Subscription and Payments"])

def _get_plans_map(db: Session) -> Dict[str, Dict]:
    """Returns {plan_name: {price, duration_days}} from DB (excludes special plans)."""
    db_plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    if not db_plans:
        _seed_default_plans(db)
        db_plans = db.query(PlanPrice).order_by(PlanPrice.id).all()
    return {p.plan_name: {"price": p.price, "duration_days": p.duration_days} for p in db_plans}


def _seed_default_plans(db: Session):
    for p in [
        {"plan_name": "15 Days",  "price": 299.0,  "duration_days": 15,  "description": "Perfect for quick audit reports and campaign testing.", "is_special": False},
        {"plan_name": "1 Month",  "price": 499.0,  "duration_days": 30,  "description": "Standard monthly access to refine your marketing systems.", "is_special": False},
        {"plan_name": "3 Months", "price": 1299.0, "duration_days": 90,  "description": "Medium-term plan for growing businesses and active audits.", "is_special": False},
        {"plan_name": "6 Months", "price": 2299.0, "duration_days": 180, "description": "Semi-annual package for established marketing consultants.", "is_special": False},
        {"plan_name": "1 Year",   "price": 3999.0, "duration_days": 365, "description": "Ultimate yearly pass with full executive privileges.", "is_special": False},
    ]:
        db.add(PlanPrice(**p))
    db.commit()


def _razorpay_keys():
    from app.core.config import settings
    key_id = settings.RAZORPAY_KEY_ID or os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = settings.RAZORPAY_KEY_SECRET or os.getenv("RAZORPAY_KEY_SECRET", "")
    is_configured = bool(key_id and key_secret and key_id not in ("rzp_test_dummy", "dummy_key"))
    return key_id, key_secret, is_configured


class CreateOrderRequest(BaseModel):
    plan_name: str


class VerifyPaymentRequest(BaseModel):
    plan_name: str
    amount: float
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── Public: QR URL ────────────────────────────────────────────────────────────
@router.get("/qr-url")
def get_qr_url(db: Session = Depends(get_db)):
    row = db.query(PlatformSettings).filter(PlatformSettings.key == "qr_image_url").first()
    url = row.value if row else None
    return {"qr_image_url": url}


# ── Public: plans (excludes special/admin-only plans) ─────────────────────────
@router.get("/plans", response_model=List[Dict[str, Any]])
def list_public_plans(db: Session = Depends(get_db)):
    """Returns all non-special subscription plans visible to all users."""
    db_plans = db.query(PlanPrice).filter(
        PlanPrice.is_special == False  # noqa: E712
    ).order_by(PlanPrice.id).all()
    if not db_plans:
        _seed_default_plans(db)
        db_plans = db.query(PlanPrice).filter(
            PlanPrice.is_special == False  # noqa: E712
        ).order_by(PlanPrice.id).all()

    return [
        {
            "id": p.id,
            "plan_name": p.plan_name,
            "price": p.price,
            "duration_days": p.duration_days,
            "description": p.description,
            "is_special": p.is_special,
        }
        for p in db_plans
    ]


@router.get("/status")
def get_status(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    AccessService.log_access(db, current_user.id, "check_status")
    return AccessService.get_access_status(db, current_user.id)


@router.post("/create-order")
def create_order(
    body: CreateOrderRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Creates a Razorpay order for the selected plan."""
    plans = _get_plans_map(db)
    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{body.plan_name}'. Available: {list(plans.keys())}",
        )

    plan = plans[body.plan_name]
    amount_in_paise = int(plan["price"] * 100)
    key_id, key_secret, is_configured = _razorpay_keys()

    if not is_configured:
        return {
            "success": True,
            "order_id": f"mock_order_{uuid.uuid4().hex[:8]}",
            "amount": plan["price"],
            "currency": "INR",
            "key_id": "",
            "is_mock": True,
        }

    try:
        import razorpay
        client = razorpay.Client(auth=(key_id, key_secret))
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"rcpt_{current_user.id}_{uuid.uuid4().hex[:8]}",
            "notes": {"user_id": str(current_user.id), "plan_name": body.plan_name},
        }
        order = client.order.create(data=order_data)
        return {
            "success": True,
            "order_id": order["id"],
            "amount": plan["price"],
            "currency": "INR",
            "key_id": key_id,
            "is_mock": False,
        }
    except Exception as e:
        print(f"[Razorpay] create_order error: {e}")
        return {
            "success": True,
            "order_id": f"mock_order_{uuid.uuid4().hex[:8]}",
            "amount": plan["price"],
            "currency": "INR",
            "key_id": "",
            "is_mock": True,
        }


@router.post("/verify-payment")
def verify_payment(
    body: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Verifies Razorpay signature and activates the subscription."""
    plans = _get_plans_map(db)
    if body.plan_name not in plans:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan '{body.plan_name}'.",
        )
    duration_days = plans[body.plan_name]["duration_days"]

    _, key_secret, _ = _razorpay_keys()
    is_mock = body.razorpay_order_id.startswith("mock_order_")

    result = AccessService.process_payment_and_subscription(
        db=db,
        user_id=current_user.id,
        plan_name=body.plan_name,
        amount=body.amount,
        razorpay_order_id=body.razorpay_order_id,
        razorpay_payment_id=body.razorpay_payment_id,
        razorpay_signature=body.razorpay_signature,
        secret=key_secret,
        duration_days=duration_days,
        skip_signature_verification=is_mock,
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


# ── Razorpay Webhook ──────────────────────────────────────────────────────────
@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    """Razorpay webhook endpoint. Verifies signature and activates subscription on payment.captured."""
    _, key_secret, _ = _razorpay_keys()
    body_bytes = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    # Verify webhook signature
    if key_secret:
        try:
            expected = hmac.new(
                key_secret.encode("utf-8"),
                body_bytes,
                hashlib.sha256
            ).hexdigest()
            if not hmac.compare_digest(expected, signature):
                raise HTTPException(status_code=400, detail="Invalid webhook signature")
        except Exception as e:
            print(f"[Webhook] Signature error: {e}")
            raise HTTPException(status_code=400, detail="Webhook signature verification failed")

    import json
    try:
        payload = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event", "")
    print(f"[Webhook] Received event: {event}")

    if event == "payment.captured":
        entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_payment_id = entity.get("id", "")
        razorpay_order_id = entity.get("order_id", "")
        amount = entity.get("amount", 0) / 100  # paise → rupees
        notes = entity.get("notes", {})
        user_id = notes.get("user_id")
        plan_name = notes.get("plan_name")

        if not user_id or not plan_name:
            print("[Webhook] Missing user_id or plan_name in notes — skipping activation")
            return {"status": "ok", "detail": "Missing notes, skipping activation"}

        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return {"status": "ok", "detail": "Invalid user_id"}

        plans = _get_plans_map(db)
        if plan_name not in plans:
            return {"status": "ok", "detail": f"Unknown plan '{plan_name}'"}

        duration_days = plans[plan_name]["duration_days"]
        result = AccessService.process_payment_and_subscription(
            db=db,
            user_id=user_id,
            plan_name=plan_name,
            amount=amount,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature="webhook_verified",
            duration_days=duration_days,
            skip_signature_verification=True,
        )
        print(f"[Webhook] Activation result: {result}")

    return {"status": "ok"}


@router.post("/qr-payment")
def submit_qr_payment(
    plan_name: str = Form(...),
    razorpay_order_id: str = Form(...),
    screenshot: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Submits a QR payment screenshot for manual admin verification."""
    plans = _get_plans_map(db)
    if plan_name not in plans:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan = plans[plan_name]
    amount = plan["price"]

    from app.services.storage_service import StorageService
    file_bytes = screenshot.file.read()
    mime_type = screenshot.content_type or "image/png"
    payment_proof_url = StorageService.upload_file(file_bytes, screenshot.filename, mime_type, folder="proofs")

    from app.models.subscription import Payment
    payment = Payment(
        user_id=current_user.id,
        amount=amount,
        currency="INR",
        razorpay_order_id=razorpay_order_id,
        payment_method="qr",
        payment_proof=payment_proof_url,
        plan_name=plan_name,
        status="pending_verification"
    )
    db.add(payment)
    db.commit()

    return {"success": True, "detail": "Payment submitted for verification. An admin will approve it shortly."}


def run_ocr_on_file(image_path: str) -> str:
    import subprocess
    abs_path = os.path.abspath(image_path)
    ps_script = f"""
Add-Type -AssemblyName System.Runtime.WindowsRuntime
try {{
    $el = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
    $el = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
    $el = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime]

    $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync("{abs_path}").GetResults()
    $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetResults()
    $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetResults()
    $bitmap = $decoder.GetSoftwareBitmapAsync().GetResults()
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    $result = $engine.RecognizeAsync($bitmap).GetResults()
    Write-Output $result.Text
}} catch {{
    Write-Error $_.Exception.Message
}}
"""
    temp_ps1 = os.path.join(os.path.dirname(abs_path), f"ocr_{os.path.basename(abs_path)}.ps1")
    try:
        with open(temp_ps1, "w", encoding="utf-8") as f:
            f.write(ps_script)
        res = subprocess.run(
            ["powershell", "-ExecutionPolicy", "Bypass", "-File", temp_ps1],
            capture_output=True, text=True, timeout=10
        )
        if res.returncode == 0:
            return res.stdout.strip()
        print(f"[OCR] PowerShell error: {res.stderr}")
        return ""
    except Exception as e:
        print(f"[OCR] Exception: {e}")
        return ""
    finally:
        if os.path.exists(temp_ps1):
            try:
                os.remove(temp_ps1)
            except Exception:
                pass


@router.post("/detect-transaction")
def detect_transaction(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    import shutil
    import re

    os.makedirs("uploads/temp", exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    temp_filename = f"temp_{uuid.uuid4().hex}.{ext}"
    temp_filepath = os.path.join("uploads/temp", temp_filename)

    try:
        with open(temp_filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        text = run_ocr_on_file(temp_filepath)
        print(f"[OCR] Detected text: {text}")

        utr_match = re.search(r"\b\d{12}\b", text)
        if utr_match:
            return {"success": True, "transaction_id": utr_match.group(0), "text": text}

        txn_ref_match = re.search(
            r"(?:txn|transaction|ref|utr|payment|transfer|reference)\s*(?:id|no|number|ref)?\s*[:#-]?\s*([a-zA-Z0-9]{8,16})",
            text, re.IGNORECASE
        )
        if txn_ref_match:
            return {"success": True, "transaction_id": txn_ref_match.group(1), "text": text}

        any_num_match = re.search(r"\b\d{9,16}\b", text)
        if any_num_match:
            return {"success": True, "transaction_id": any_num_match.group(0), "text": text}

        return {"success": False, "transaction_id": "", "detail": "Could not find a valid Transaction ID.", "text": text}
    except Exception as e:
        print(f"[OCR] Error: {e}")
        return {"success": False, "transaction_id": "", "detail": f"OCR error: {str(e)}"}
    finally:
        if os.path.exists(temp_filepath):
            try:
                os.remove(temp_filepath)
            except Exception:
                pass
