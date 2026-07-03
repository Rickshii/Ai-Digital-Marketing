import os
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Digital Marketing Consultant SaaS Platform"

    # ── Security ──────────────────────────────────────────────────────────────
    SECRET_KEY: str = "supersecretkeyforlocaldevelopmentonlychangeinproductionenv"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # ── Database ──────────────────────────────────────────────────────────────
    # For Supabase PostgreSQL set this to the "Connection string" from:
    #   Supabase Dashboard → Project Settings → Database → Connection string (URI)
    # Example:
    #   postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
    #
    # For Railway / Render, copy the auto-generated DATABASE_URL from your plugin.
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ai_marketing"

    # Set to "true" ONLY for local development when PostgreSQL is not running.
    # Must be "false" in all cloud deployments (Railway / Render / Supabase).
    # Default to True to enable SQLite fallback for local development
    USE_SQLITE_FALLBACK: bool = True
    SQLITE_DATABASE_URL: str = "sqlite:///./ai_marketing.db"

    # ── Razorpay ──────────────────────────────────────────────────────────────
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # ── Email / SMTP (optional — for trial expiry and payment notifications) ────
    # Set SMTP_HOST to enable outgoing emails. Leave blank to disable silently.
    # Gmail: host=smtp.gmail.com port=587 tls=true user=you@gmail.com password=app-password
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""          # defaults to SMTP_USER if blank
    SMTP_TLS: str = "true"       # "true" = STARTTLS; "false" = SSL

    # ── Supabase Storage (optional — for avatar / QR image uploads) ───────────
    # If not set, the backend falls back to local disk storage in /uploads/.
    # For production, configure these to enable persistent cross-device file storage.
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: str = "uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        # Allow extra fields from .env so adding new vars doesn't crash startup
        extra = "ignore"


settings = Settings()
