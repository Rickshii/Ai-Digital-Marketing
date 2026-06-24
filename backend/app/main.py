import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal

# ── Import ALL models so SQLAlchemy registers them before create_all() ────────
from app.models.user import User
from app.models.business import BusinessProfile
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from app.models.marketing_strategy import MarketingStrategy
from app.models.report import Report
from app.models.subscription import (
    TrialHistory, Subscription, Payment,
    UserAccessLog, PlanPrice, PlatformSettings
)

logger = logging.getLogger("uvicorn.error")


# ── Schema migration (adds new columns to existing tables safely) ─────────────
def upgrade_db_schema():
    """Idempotently add new columns that may not exist in older deployments."""
    from sqlalchemy import inspect, text

    try:
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        db = SessionLocal()
        try:
            # ── business_profiles columns ─────────────────────────────────
            if "business_profiles" in existing_tables:
                bp_cols = [c["name"] for c in inspector.get_columns("business_profiles")]
                bp_new = [
                    ("business_category",       "VARCHAR(255)"),
                    ("business_address",        "VARCHAR(255)"),
                    ("city",                    "VARCHAR(100)"),
                    ("state",                   "VARCHAR(100)"),
                    ("country",                 "VARCHAR(100)"),
                    ("pincode",                 "VARCHAR(20)"),
                    ("google_profile_registered","VARCHAR(10)"),
                    ("google_maps_link",        "VARCHAR(500)"),
                    ("number_of_branches",      "INTEGER DEFAULT 0"),
                    ("branch_locations",        "TEXT"),
                    ("whatsapp_number",         "VARCHAR(50)"),
                ]
                for col_name, col_type in bp_new:
                    if col_name not in bp_cols:
                        db.execute(text(
                            f"ALTER TABLE business_profiles ADD COLUMN {col_name} {col_type}"
                        ))
                        db.commit()
                        logger.info(f"[Migration] Added business_profiles.{col_name}")

            # ── payments columns ──────────────────────────────────────────
            if "payments" in existing_tables:
                pay_cols = [c["name"] for c in inspector.get_columns("payments")]
                pay_new = [
                    ("payment_method", "VARCHAR(50) DEFAULT 'razorpay'"),
                    ("payment_proof",  "VARCHAR(500)"),
                    ("plan_name",      "VARCHAR(100)"),
                ]
                for col_name, col_type in pay_new:
                    if col_name not in pay_cols:
                        db.execute(text(
                            f"ALTER TABLE payments ADD COLUMN {col_name} {col_type}"
                        ))
                        db.commit()
                        logger.info(f"[Migration] Added payments.{col_name}")

            # ── users columns ─────────────────────────────────────────────
            if "users" in existing_tables:
                user_cols = [c["name"] for c in inspector.get_columns("users")]
                if "avatar_url" not in user_cols:
                    db.execute(text("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500)"))
                    db.commit()
                    logger.info("[Migration] Added users.avatar_url")

        except Exception as e:
            db.rollback()
            logger.error(f"[Migration] Schema upgrade error: {e}")
        finally:
            db.close()

    except Exception as e:
        logger.error(f"[Migration] Inspector error: {e}")


# ── Admin user seeding ────────────────────────────────────────────────────────
def seed_admin_user():
    """Ensure the default admin account exists and is healthy on every startup."""
    from app.core.security import get_password_hash, verify_password

    ADMIN_EMAIL    = "demo@marketerai.com"
    ADMIN_PASSWORD = "demo1234"
    ADMIN_NAME     = "Demo Admin"

    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if not admin:
            admin = User(
                email=ADMIN_EMAIL,
                full_name=ADMIN_NAME,
                hashed_password=get_password_hash(ADMIN_PASSWORD),
                role="admin",
            )
            db.add(admin)
            db.commit()
            logger.info(f"[Startup] Created default admin: {ADMIN_EMAIL}")
        else:
            changed = False
            if admin.role != "admin":
                admin.role = "admin"
                changed = True
            if not admin.full_name or admin.full_name.strip() != ADMIN_NAME:
                admin.full_name = ADMIN_NAME
                changed = True
            if not verify_password(ADMIN_PASSWORD, admin.hashed_password):
                admin.hashed_password = get_password_hash(ADMIN_PASSWORD)
                changed = True
                logger.info(f"[Startup] Rehashed password for {ADMIN_EMAIL}")
            if changed:
                db.commit()
                logger.info(f"[Startup] Admin account repaired: {ADMIN_EMAIL}")
            else:
                logger.info(f"[Startup] Admin OK (id={admin.id})")

    except Exception as e:
        db.rollback()
        logger.error(f"[Startup] seed_admin_user error: {e}")
    finally:
        db.close()


# ── Seed default subscription plans if none exist ────────────────────────────
def seed_default_plans():
    db = SessionLocal()
    try:
        if db.query(PlanPrice).count() == 0:
            defaults = [
                PlanPrice(plan_name="15 Days",  price=299.0,  duration_days=15,
                          description="Perfect for quick audit reports and campaign testing."),
                PlanPrice(plan_name="1 Month",  price=499.0,  duration_days=30,
                          description="Standard monthly access to refine your marketing systems."),
                PlanPrice(plan_name="3 Months", price=1299.0, duration_days=90,
                          description="Medium-term plan for growing businesses and active audits."),
                PlanPrice(plan_name="6 Months", price=2299.0, duration_days=180,
                          description="Semi-annual package for established marketing consultants."),
                PlanPrice(plan_name="1 Year",   price=3999.0, duration_days=365,
                          description="Ultimate yearly pass with full executive privileges."),
            ]
            db.add_all(defaults)
            db.commit()
            logger.info("[Startup] Seeded 5 default subscription plans.")
    except Exception as e:
        db.rollback()
        logger.error(f"[Startup] seed_default_plans error: {e}")
    finally:
        db.close()


def seed_known_user_accounts():
    """
    Migrates all known user accounts (from local SQLite) into the production
    PostgreSQL database. This runs on every startup but is idempotent — existing
    accounts are never touched or overwritten.

    This ensures that:
    - Users who registered before the PostgreSQL migration can still log in
    - trendytrinkets@gmail.com, rickshii@gmail.com, etc. are preserved
    - Their original bcrypt password hashes are copied verbatim
    """
    from app.core.security import get_password_hash
    from app.services.access_service import AccessService
    from datetime import timedelta

    # ── All accounts from the local ai_marketing.db SQLite export ────────────
    MIGRATE_ACCOUNTS = [
        # Primary admin — always use canonical password (re-hashed fresh)
        {
            "email": "demo@marketerai.com",
            "full_name": "Demo Admin",
            "role": "admin",
            "password": "demo1234",          # canonical — rehash on create
            "hashed": None,
        },
        # User accounts — copied verbatim from SQLite with original hashes
        {
            "email": "rickshii@gmail.com",
            "full_name": "Rickshii",
            "role": "user",
            "password": None,
            "hashed": "$2b$12$t5lsBICe4FT/zLMYXugwKuw1r3wAfqlJJNqMwnj8klOEFRG7x38Fq",
        },
        {
            "email": "trendytrinkets@gmail.com",
            "full_name": "Rickshii",
            "role": "user",
            "password": None,
            "hashed": "$2b$12$LnvEHp054Kn9s2Hr9gU22eV7P3RN.m.DdxTEobkPRQkMlWZv49jba",
        },
        {
            "email": "user@example.com",
            "full_name": "Alex Digital Marketer",
            "role": "user",
            "password": None,
            "hashed": "$2b$12$wgdaTNjr5qaitvIpDtIIUemhZVbvKiNgYG9M5sYT7llxJqq8G5ZPy",
        },
    ]

    db = SessionLocal()
    try:
        created = 0
        for acct in MIGRATE_ACCOUNTS:
            email = acct["email"]
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                continue  # Already in PostgreSQL — skip silently

            # Use supplied bcrypt hash or hash the canonical password
            pw_hash = acct["hashed"] or get_password_hash(acct["password"])

            new_user = User(
                email=email,
                full_name=acct["full_name"],
                hashed_password=pw_hash,
                role=acct["role"],
            )
            db.add(new_user)
            db.flush()   # get new_user.id

            # Start trial for regular users
            if acct["role"] != "admin":
                from datetime import timedelta
                from app.models.subscription import TrialHistory
                trial = TrialHistory(
                    user_id=new_user.id,
                    start_date=datetime.utcnow(),
                    expiry_date=datetime.utcnow() + timedelta(days=30),
                )
                db.add(trial)

            db.commit()
            logger.info(f"[Startup] Migrated account: {email} (id={new_user.id}, role={acct['role']})")
            created += 1

        if created:
            logger.info(f"[Startup] Account migration complete — {created} accounts added to PostgreSQL.")

    except Exception as e:
        db.rollback()
        logger.error(f"[Startup] seed_known_user_accounts error: {e}")
    finally:
        db.close()


# ── FastAPI lifespan (replaces deprecated @app.on_event) ─────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("[Startup] Creating / verifying database tables …")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("[Startup] Tables OK ✓")
    except Exception as e:
        logger.error(f"[Startup] create_all failed: {e}")
        raise

    upgrade_db_schema()
    seed_admin_user()
    seed_default_plans()
    seed_known_user_accounts()   # Migrate SQLite accounts → PostgreSQL

    logger.info("[Startup] Application ready ✓")
    yield
    logger.info("[Shutdown] Application stopping.")


# ── Import routers ────────────────────────────────────────────────────────────
from app.api import auth, business, audit, social_media, strategy, reports, admin, subscription

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Digital Marketing Consultant SaaS Platform.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Static file serving (local uploads fallback) ──────────────────────────────
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ── CORS ──────────────────────────────────────────────────────────────────────
# allow_credentials must be False when allow_origins=["*"] (HTTP spec).
# We authenticate via Bearer tokens in the Authorization header — no cookies.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routers ───────────────────────────────────────────────────────────────
app.include_router(auth.router,         prefix="/api")
app.include_router(business.router,     prefix="/api")
app.include_router(audit.router,        prefix="/api")
app.include_router(social_media.router, prefix="/api")
app.include_router(strategy.router,     prefix="/api")
app.include_router(reports.router,      prefix="/api")
app.include_router(admin.router,        prefix="/api")
app.include_router(subscription.router, prefix="/api")


# ── Root endpoints ────────────────────────────────────────────────────────────
@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API v2.0",
        "documentation": "/docs",
        "status": "healthy",
        "modules": [
            "auth", "business", "audit", "social-media",
            "strategy", "reports", "admin", "subscription",
        ],
    }


@app.get("/health")
def health_check():
    """Lightweight health check for uptime monitors and deployment pipelines."""
    from sqlalchemy import text
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    finally:
        db.close()
    return {
        "status": "ok",
        "database": db_status,
        "version": "2.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
