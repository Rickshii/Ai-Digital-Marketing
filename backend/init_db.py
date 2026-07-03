#!/usr/bin/env python3
"""
Database initialization and verification script.

This script:
1. Loads environment variables from .env
2. Connects to the database (with automatic SQLite fallback)
3. Creates all necessary tables
4. Seeds default data (plans, platform settings, admin user)
5. Reports the database status

Usage:
    python init_db.py
"""

import os
import sys
import logging
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables (optional, already loaded by system)
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available, use system env vars

# Import app components
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
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
from sqlalchemy import inspect, text


def check_database_connection():
    """Test the database connection."""
    logger.info("Checking database connection...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection successful")
            
            # Get database info
            inspector = inspect(engine)
            db_url = settings.DATABASE_URL
            if "@" in db_url:
                db_display = db_url.split("@")[-1].split("?")[0]
            else:
                db_display = "SQLite (fallback)"
            logger.info(f"  Database: {db_display}")
            
            return True
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        return False


def create_tables():
    """Create all database tables."""
    logger.info("Creating database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✓ Tables created successfully")
        
        # List tables
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        logger.info(f"  Tables: {', '.join(sorted(tables))}")
        
        return True
    except Exception as e:
        logger.error(f"✗ Failed to create tables: {e}")
        return False


def seed_default_plans():
    """Seed default subscription plans."""
    logger.info("Seeding default subscription plans...")
    db = SessionLocal()
    try:
        existing = db.query(PlanPrice).first()
        if existing:
            logger.info("  (Plans already exist)")
            return True
        
        plans = [
            PlanPrice(
                plan_name="Free",
                price=0,
                duration_days=7,
                description="Free trial plan with basic features",
                is_special=False,
            ),
            PlanPrice(
                plan_name="Premium",
                price=999,
                duration_days=30,
                description="Premium plan with unlimited features",
                is_special=False,
            ),
        ]
        
        for plan in plans:
            db.add(plan)
        db.commit()
        logger.info(f"✓ Seeded {len(plans)} plans")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to seed plans: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def seed_default_platform_settings():
    """Seed default platform settings."""
    logger.info("Seeding default platform settings...")
    db = SessionLocal()
    try:
        existing = db.query(PlatformSettings).first()
        if existing:
            logger.info("  (Settings already exist)")
            return True
        
        # Create a basic settings entry
        settings_entry = PlatformSettings(
            key="initialized",
            value="true"
        )
        db.add(settings_entry)
        db.commit()
        logger.info("✓ Platform settings initialized")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to seed settings: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def seed_admin_user():
    """Ensure the admin user exists."""
    logger.info("Verifying admin user...")
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if admin:
            logger.info("  (Admin user already exists)")
            return True
        
        from app.core.security import get_password_hash
        
        admin = User(
            email="admin@example.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role="admin",
        )
        db.add(admin)
        db.commit()
        logger.info("✓ Admin user created (email: admin@example.com, password: admin123)")
        return True
    except Exception as e:
        logger.error(f"✗ Failed to create admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()


def main():
    """Run all initialization steps."""
    logger.info("=" * 60)
    logger.info("Database Initialization")
    logger.info("=" * 60)
    logger.info(f"Environment: DATABASE_URL={'*' * 40}")
    logger.info(f"USE_SQLITE_FALLBACK: {settings.USE_SQLITE_FALLBACK}")
    logger.info("")
    
    steps = [
        ("Database Connection", check_database_connection),
        ("Create Tables", create_tables),
        ("Seed Plans", seed_default_plans),
        ("Seed Settings", seed_default_platform_settings),
        ("Create Admin", seed_admin_user),
    ]
    
    results = []
    for step_name, step_fn in steps:
        try:
            result = step_fn()
            results.append((step_name, result))
        except Exception as e:
            logger.error(f"✗ {step_name} failed: {e}")
            results.append((step_name, False))
        logger.info("")
    
    # Summary
    logger.info("=" * 60)
    logger.info("Summary")
    logger.info("=" * 60)
    for step_name, result in results:
        status = "✓" if result else "✗"
        logger.info(f"{status} {step_name}")
    
    all_success = all(result for _, result in results)
    logger.info("=" * 60)
    
    if all_success:
        logger.info("✓ Database initialized successfully!")
        return 0
    else:
        logger.error("✗ Some steps failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
