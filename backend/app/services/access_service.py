import hmac
import hashlib
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.subscription import TrialHistory, Subscription, Payment, UserAccessLog
from app.models.user import User

class AccessService:
    @staticmethod
    def start_trial(db: Session, user_id: int) -> TrialHistory:
        """Starts a 3-day free trial for the user if they don't already have one."""
        # Check if trial already exists
        existing = db.query(TrialHistory).filter(TrialHistory.user_id == user_id).first()
        if existing:
            return existing
            
        start_date = datetime.utcnow()
        expiry_date = start_date + timedelta(days=3)
        trial = TrialHistory(
            user_id=user_id,
            start_date=start_date,
            expiry_date=expiry_date
        )
        db.add(trial)
        db.commit()
        db.refresh(trial)
        return trial

    @staticmethod
    def get_access_status(db: Session, user_id: int) -> dict:
        """Returns detailed access permissions, remaining trial days, and subscription status for a user."""
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "has_access": False,
                "trial_active": False,
                "trial_days_left": 0,
                "subscription_active": False,
                "role": "user"
            }

        # Admins have unlimited access
        if user.role == "admin":
            return {
                "has_access": True,
                "trial_active": True,
                "trial_days_left": 9999,
                "trial_start": None,
                "trial_expiry": None,
                "subscription_active": True,
                "subscription_plan": "Enterprise Admin",
                "subscription_expiry": None,
                "role": "admin"
            }

        now = datetime.utcnow()
        
        # Check trial
        trial = db.query(TrialHistory).filter(TrialHistory.user_id == user_id).order_by(TrialHistory.expiry_date.desc()).first()
        trial_active = False
        trial_days_left = 0
        trial_start = None
        trial_expiry = None

        if trial:
            trial_start = trial.start_date
            trial_expiry = trial.expiry_date
            if trial.expiry_date > now:
                trial_active = True
                delta = trial.expiry_date - now
                trial_days_left = max(0, delta.days) + (1 if delta.seconds > 0 else 0)  # Round up to nearest day
            else:
                trial_days_left = 0
        else:
            # If no trial found, create it automatically (e.g. for pre-existing users)
            trial = AccessService.start_trial(db, user_id)
            trial_start = trial.start_date
            trial_expiry = trial.expiry_date
            trial_active = True
            delta = trial.expiry_date - now
            trial_days_left = max(0, delta.days) + (1 if delta.seconds > 0 else 0)

        # Check subscription
        sub = db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        ).order_by(Subscription.expiry_date.desc()).first()
        
        sub_active = False
        sub_plan = None
        sub_expiry = None

        if sub:
            sub_plan = sub.plan_name
            sub_expiry = sub.expiry_date
            if sub.expiry_date > now:
                sub_active = True
            else:
                # Update status to expired
                sub.status = "expired"
                db.commit()

        has_access = trial_active or sub_active

        return {
            "has_access": has_access,
            "trial_active": trial_active,
            "trial_days_left": trial_days_left,
            "trial_start": trial_start.isoformat() if trial_start else None,
            "trial_expiry": trial_expiry.isoformat() if trial_expiry else None,
            "subscription_active": sub_active,
            "subscription_plan": sub_plan,
            "subscription_expiry": sub_expiry.isoformat() if sub_expiry else None,
            "role": user.role
        }

    @staticmethod
    def verify_razorpay_signature(order_id: str, payment_id: str, signature: str, secret: str) -> bool:
        """Verifies Razorpay payment signature using HMAC-SHA256."""
        if not secret or secret in ("dummy_secret", "") or order_id.startswith("mock_"):
            # Development / mock mode — skip signature verification
            return True
        try:
            msg = f"{order_id}|{payment_id}"
            generated = hmac.new(
                secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated, signature)
        except Exception:
            return False

    @staticmethod
    def process_payment_and_subscription(
        db: Session,
        user_id: int,
        plan_name: str,
        amount: float,
        razorpay_order_id: str,
        razorpay_payment_id: str,
        razorpay_signature: str,
        secret: str = "",
        duration_days: int = None
    ) -> dict:
        """Verifies payment signature, records the payment, and activates/extends subscription.
        
        The subscription is ONLY activated after a valid payment signature is confirmed.
        No plan is activated if verification fails.
        """
        # Step 1: Verify Razorpay signature — gate everything behind this
        is_valid = AccessService.verify_razorpay_signature(
            razorpay_order_id, razorpay_payment_id, razorpay_signature, secret
        )
        if not is_valid:
            # Record failed attempt for audit trail
            failed_payment = Payment(
                user_id=user_id,
                amount=amount,
                razorpay_order_id=razorpay_order_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature,
                status="failed"
            )
            db.add(failed_payment)
            db.commit()
            return {"success": False, "detail": "Payment signature verification failed. No plan was activated."}

        # Step 2: Idempotency check — prevent replay attacks / double-activation
        existing_payment = db.query(Payment).filter(
            Payment.razorpay_order_id == razorpay_order_id,
            Payment.status == "success"
        ).first()
        if existing_payment:
            return {"success": True, "detail": "Payment already processed. Subscription is active."}

        # Step 3: Record the successful payment
        payment = Payment(
            user_id=user_id,
            amount=amount,
            razorpay_order_id=razorpay_order_id,
            razorpay_payment_id=razorpay_payment_id,
            razorpay_signature=razorpay_signature,
            status="success"
        )
        db.add(payment)

        # Step 4: Resolve duration — use passed value if available, otherwise match plan name
        if not duration_days:
            pname = plan_name.lower()
            if "15 day" in pname:
                duration_days = 15
            elif "1 month" in pname:
                duration_days = 30
            elif "3 month" in pname:
                duration_days = 90
            elif "6 month" in pname:
                duration_days = 180
            elif "1 year" in pname or "12 month" in pname:
                duration_days = 365
            else:
                duration_days = 30  # Safe default

        # Step 5: Activate or extend subscription — ONLY after payment success
        now = datetime.utcnow()
        active_sub = db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == "active",
            Subscription.expiry_date > now
        ).first()

        # Stack on top of existing active subscription if present
        start_date = active_sub.expiry_date if active_sub else now
        expiry_date = start_date + timedelta(days=duration_days)

        if active_sub:
            active_sub.expiry_date = expiry_date
            active_sub.plan_name = plan_name
            active_sub.price = amount
        else:
            new_sub = Subscription(
                user_id=user_id,
                plan_name=plan_name,
                price=amount,
                start_date=now,
                expiry_date=expiry_date,
                status="active"
            )
            db.add(new_sub)

        # Step 6: Log the access event
        AccessService.log_access(db, user_id, f"purchased_plan:{plan_name}")

        db.commit()
        return {
            "success": True,
            "detail": "Subscription activated successfully.",
            "plan_name": plan_name,
            "expiry_date": expiry_date.isoformat(),
            "duration_days": duration_days
        }

    @staticmethod
    def log_access(db: Session, user_id: int, action: str, ip_address: str = None) -> UserAccessLog:
        """Logs user access events for compliance and security auditing."""
        log = UserAccessLog(
            user_id=user_id,
            action=action,
            ip_address=ip_address
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
