import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Digital Marketing Consultant SaaS Platform"
    SECRET_KEY: str = os.environ.get("SECRET_KEY", "supersecretkeyforlocaldevelopmentonlychangeinproductionenv")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/ai_marketing")
    USE_SQLITE_FALLBACK: bool = os.environ.get("USE_SQLITE_FALLBACK", "true").lower() == "true"
    SQLITE_DATABASE_URL: str = "sqlite:///./ai_marketing.db"

    # Razorpay configurations
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
