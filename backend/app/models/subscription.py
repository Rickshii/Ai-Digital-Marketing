from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class TrialHistory(Base):
    __tablename__ = "trial_histories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="trial_histories")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    plan_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    status = Column(String, default="active", nullable=False)  # "active", "expired"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")

class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    razorpay_order_id = Column(String, unique=True, index=True, nullable=False)
    razorpay_payment_id = Column(String, unique=True, index=True, nullable=True)
    razorpay_signature = Column(String, nullable=True)
    payment_method = Column(String, default="razorpay", nullable=False)
    payment_proof = Column(String, nullable=True)
    plan_name = Column(String, nullable=True)
    status = Column(String, default="pending", nullable=False)  # "pending", "pending_verification", "success", "failed"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="payments")

class UserAccessLog(Base):
    __tablename__ = "user_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="access_logs")

class PlanPrice(Base):
    __tablename__ = "plan_prices"

    id = Column(Integer, primary_key=True, index=True)
    plan_name = Column(String, unique=True, index=True, nullable=False)
    price = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    # Special plans are only visible to admins; they can assign them directly to users
    is_special = Column(Boolean, default=False, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class PlatformSettings(Base):
    """Singleton settings table — one row stores platform-wide config like the QR image URL."""
    __tablename__ = "platform_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
