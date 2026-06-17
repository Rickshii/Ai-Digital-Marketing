from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base

# Import models to ensure they are registered with the Base
from app.models.user import User
from app.models.business import BusinessProfile
from app.models.audit import WebsiteAudit
from app.models.social_media import SocialMediaAnalysis
from app.models.marketing_strategy import MarketingStrategy
from app.models.report import Report
from app.models.subscription import TrialHistory, Subscription, Payment, UserAccessLog


# Dynamically create tables on startup for simplicity in testing
Base.metadata.create_all(bind=engine)

def upgrade_db_schema():
    from sqlalchemy import inspect, text
    from app.core.database import SessionLocal
    
    inspector = inspect(engine)
    if 'business_profiles' not in inspector.get_table_names():
        return
        
    columns = [col['name'] for col in inspector.get_columns('business_profiles')]
    
    columns_to_add = [
        ("business_category", "VARCHAR(255)"),
        ("business_address", "VARCHAR(255)"),
        ("city", "VARCHAR(100)"),
        ("state", "VARCHAR(100)"),
        ("country", "VARCHAR(100)"),
        ("pincode", "VARCHAR(20)"),
        ("google_profile_registered", "VARCHAR(10)"),
        ("google_maps_link", "VARCHAR(500)"),
        ("number_of_branches", "INTEGER DEFAULT 0"),
        ("branch_locations", "TEXT"),
        ("whatsapp_number", "VARCHAR(50)"),
    ]
    
    db = SessionLocal()
    try:
        for col_name, col_type in columns_to_add:
            if col_name not in columns:
                db.execute(text(f"ALTER TABLE business_profiles ADD COLUMN {col_name} {col_type}"))
                db.commit()
                print(f"Added column {col_name} of type {col_type} to business_profiles.")

        # Migrate payments
        if 'payments' in inspector.get_table_names():
            payment_cols = [col['name'] for col in inspector.get_columns('payments')]
            if 'payment_method' not in payment_cols:
                db.execute(text("ALTER TABLE payments ADD COLUMN payment_method VARCHAR(50) DEFAULT 'razorpay'"))
                db.commit()
            if 'payment_proof' not in payment_cols:
                db.execute(text("ALTER TABLE payments ADD COLUMN payment_proof VARCHAR(500)"))
                db.commit()
            if 'plan_name' not in payment_cols:
                db.execute(text("ALTER TABLE payments ADD COLUMN plan_name VARCHAR(100)"))
                db.commit()

    except Exception as e:
        db.rollback()
        print(f"Error checking/migrating schema: {e}")
    finally:
        db.close()

upgrade_db_schema()

from app.api import auth, business, audit
from app.api import social_media, strategy, reports, admin, subscription

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-powered Digital Marketing Consultant SaaS Platform.",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

import os
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",  # Vite default port
    "http://127.0.0.1:5173",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/api")
app.include_router(business.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(social_media.router, prefix="/api")
app.include_router(strategy.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(subscription.router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API v2.0",
        "documentation": "/docs",
        "status": "healthy",
        "modules": ["auth", "business", "seo-audit", "social-media"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
