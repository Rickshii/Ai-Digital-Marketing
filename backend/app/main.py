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

            # ── plan_prices columns ───────────────────────────────────────
            if "plan_prices" in existing_tables:
                pp_cols = [c["name"] for c in inspector.get_columns("plan_prices")]
                if "is_special" not in pp_cols:
                    db.execute(text("ALTER TABLE plan_prices ADD COLUMN is_special BOOLEAN DEFAULT FALSE NOT NULL"))
                    db.commit()
                    logger.info("[Migration] Added plan_prices.is_special")

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
    Seeds all known user accounts into the production PostgreSQL database.
    This runs on every startup but is idempotent — existing accounts are
    never touched or overwritten.

    All passwords are canonical (plain-text, hashed fresh on every seed run)
    so users can always log in with these credentials on any new deployment.

    Credentials summary:
      demo@marketerai.com      / demo1234      (admin)
      rickshii@gmail.com       / rickshii123   (user)
      trendytrinkets@gmail.com / trendy1234    (user)
      user@example.com         / user1234      (user)
      admin@example.com        / admin1234     (admin)
    """
    from app.core.security import get_password_hash
    from app.services.access_service import AccessService
    from datetime import datetime, timedelta
    from app.models.subscription import TrialHistory

    # ── All seeded accounts — all use canonical passwords, hashed fresh ───────
    MIGRATE_ACCOUNTS = [
        {
            "email": "demo@marketerai.com",
            "full_name": "Demo Admin",
            "role": "admin",
            "password": "demo1234",
        },
        {
            "email": "rickshii@gmail.com",
            "full_name": "Rickshii",
            "role": "user",
            "password": "rickshii123",
        },
        {
            "email": "trendytrinkets@gmail.com",
            "full_name": "Rickshii",
            "role": "user",
            "password": "trendy1234",
        },
        {
            "email": "user@example.com",
            "full_name": "Alex Digital Marketer",
            "role": "user",
            "password": "user1234",
        },
        {
            "email": "admin@example.com",
            "full_name": "Sarah Administrator",
            "role": "admin",
            "password": "admin1234",
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

            pw_hash = get_password_hash(acct["password"])

            new_user = User(
                email=email,
                full_name=acct["full_name"],
                hashed_password=pw_hash,
                role=acct["role"],
            )
            db.add(new_user)
            db.flush()   # get new_user.id

            # Start 3-day trial for regular users
            if acct["role"] != "admin":
                trial = TrialHistory(
                    user_id=new_user.id,
                    start_date=datetime.utcnow(),
                    expiry_date=datetime.utcnow() + timedelta(days=3),
                )
                db.add(trial)

            db.commit()
            logger.info(f"[Startup] Seeded account: {email} (id={new_user.id}, role={acct['role']})")
            created += 1

        if created:
            logger.info(f"[Startup] Account seeding complete — {created} accounts added to PostgreSQL.")

    except Exception as e:
        db.rollback()
        logger.error(f"[Startup] seed_known_user_accounts error: {e}")
    finally:
        db.close()


def seed_default_platform_settings():
    db = SessionLocal()
    try:
        from app.core.default_qr_constant import DEFAULT_QR_BASE64
        row = db.query(PlatformSettings).filter(PlatformSettings.key == "qr_image_url").first()
        if not row:
            row = PlatformSettings(key="qr_image_url", value=DEFAULT_QR_BASE64)
            db.add(row)
            db.commit()
            logger.info("[Startup] Seeded default platform QR code into database.")
        elif not row.value:
            row.value = DEFAULT_QR_BASE64
            db.commit()
            logger.info("[Startup] Restored empty platform QR code in database.")
    except Exception as e:
        db.rollback()
        logger.error(f"[Startup] seed_default_platform_settings error: {e}")
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
    seed_default_platform_settings()  # Seed default QR code

    logger.info("[Startup] Application ready ✓")

    # ── Background: trial-expiry email scheduler ───────────────────────────
    import asyncio

    async def _trial_expiry_scheduler():
        """
        Check every hour for users whose trial expires in ≤24 hours and
        send them a warning email (once per user — tracked via DB flag).
        """
        from app.services.email_service import send_trial_expiry_warning
        from app.core.database import SessionLocal as _SL
        from app.models.user import User as _User
        from app.models.subscription import Subscription as _Sub, PlatformSettings as _PS
        from datetime import datetime, timedelta

        await asyncio.sleep(10)   # let the server finish starting first

        while True:
            try:
                db = _SL()
                now = datetime.utcnow()
                warning_window = now + timedelta(hours=25)  # warn if expiry < 25 h away

                subs = (
                    db.query(_Sub, _User)
                    .join(_User, _Sub.user_id == _User.id)
                    .filter(
                        _Sub.expiry_date != None,
                        _Sub.expiry_date > now,
                        _Sub.expiry_date <= warning_window,
                        _Sub.status.in_(["trial", "active"]),
                    )
                    .all()
                )

                for sub, user in subs:
                    # Skip if already warned (store flag as platform setting keyed by user)
                    flag_key = f"trial_warned_{user.id}_{sub.id}"
                    existing_flag = (
                        db.query(_PS).filter(_PS.key == flag_key).first()
                    )
                    if existing_flag:
                        continue

                    hours_left = max(1, int((sub.expiry_date - now).total_seconds() / 3600))
                    sent = send_trial_expiry_warning(
                        to_email=user.email,
                        full_name=user.full_name or user.email,
                        hours_remaining=hours_left,
                    )
                    if sent:
                        # Mark as warned so we don't send again
                        flag = _PS(key=flag_key, value="sent")
                        db.add(flag)
                        db.commit()
                        logger.info(
                            f"[Email] Trial expiry warning sent to {user.email} "
                            f"({hours_left}h remaining)"
                        )

                db.close()
            except Exception as exc:
                logger.error(f"[Email] Trial-expiry scheduler error: {exc}")

            await asyncio.sleep(3600)   # check every hour

    asyncio.create_task(_trial_expiry_scheduler())

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

# ── Serve built React frontend in production ──────────────────────────────────
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
_frontend_dist = os.path.normpath(_frontend_dist)

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
    # In production, serve the React frontend index.html
    if os.path.isfile(os.path.join(_frontend_dist, "index.html")):
        from fastapi.responses import FileResponse
        return FileResponse(os.path.join(_frontend_dist, "index.html"))
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


# ── Serve React static assets & SPA catch-all (production only) ───────────────
if os.path.isdir(_frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(_frontend_dist, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """Catch-all: serve the React SPA for any non-API route."""
        from fastapi.responses import FileResponse
        file_path = os.path.join(_frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
