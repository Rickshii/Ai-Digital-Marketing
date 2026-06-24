#!/usr/bin/env python3
"""
verify_db.py — Database connection verifier for AI Digital Marketing SaaS Platform.

Run this script to diagnose database connectivity issues before deployment:

    python verify_db.py

It will:
1. Load DATABASE_URL from .env
2. Attempt to connect to the database
3. Check all expected tables exist
4. Verify the admin user account
5. Count rows in key tables
6. Report connection status
"""

import os
import sys
import traceback

# Add backend app to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load .env before importing settings
from dotenv import load_dotenv
load_dotenv()

print("\n" + "=" * 60)
print("  AI Digital Marketing — Database Connection Verifier")
print("=" * 60)

# ── Step 1: Load configuration ────────────────────────────────────────────────
try:
    from app.core.config import settings
    db_url = settings.DATABASE_URL
    
    # Fix legacy postgres:// prefix
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
    
    # Mask password in display
    display_url = db_url
    if "@" in display_url:
        pre, post = display_url.split("@", 1)
        user_part = pre.split("://", 1)[-1].split(":")[0]
        display_url = f"postgresql://{user_part}:***@{post}"
    
    print(f"\n✓ Config loaded")
    print(f"  DATABASE_URL  : {display_url}")
    print(f"  SQLite fallback: {settings.USE_SQLITE_FALLBACK}")
    print(f"  Supabase URL  : {settings.SUPABASE_URL or '(not set)'}")
except Exception as e:
    print(f"\n✗ Config load failed: {e}")
    sys.exit(1)

# ── Step 2: Connect to database ───────────────────────────────────────────────
try:
    from sqlalchemy import create_engine, text, inspect
    
    engine = create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 10},
    )
    
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version()"))
        version = result.scalar()
    
    print(f"\n✓ Database connected!")
    print(f"  Server: {version[:50] if version else 'Unknown'}")
except Exception as e:
    print(f"\n✗ Database connection FAILED!")
    print(f"  Error: {e}")
    print("\n  Troubleshooting:")
    print("  - Check DATABASE_URL in backend/.env")
    print("  - For Supabase: use the 'URI' format from Project Settings → Database")
    print("  - Ensure the database server is running")
    traceback.print_exc()
    sys.exit(1)

# ── Step 3: Check tables ──────────────────────────────────────────────────────
print("\n" + "-" * 40)
print("Table Check:")

EXPECTED_TABLES = [
    "users", "business_profiles", "website_audits",
    "social_media_analyses", "marketing_strategies",
    "reports", "trial_histories", "subscriptions",
    "payments", "user_access_logs", "plan_prices", "platform_settings",
]

try:
    inspector = inspect(engine)
    existing = inspector.get_table_names()
    
    all_ok = True
    for table in EXPECTED_TABLES:
        if table in existing:
            print(f"  ✓ {table}")
        else:
            print(f"  ✗ {table}  ← MISSING")
            all_ok = False
    
    if not all_ok:
        print("\n  Some tables are missing. Run:")
        print("    python -m alembic upgrade head")
        print("  OR start the FastAPI app once (it auto-creates tables on startup).")
    else:
        print("\n  All 12 tables present ✓")

except Exception as e:
    print(f"  Table inspection failed: {e}")

# ── Step 4: Row counts ────────────────────────────────────────────────────────
print("\n" + "-" * 40)
print("Row Counts:")

tables_to_count = [
    "users", "business_profiles", "subscriptions",
    "payments", "plan_prices", "platform_settings",
]

try:
    with engine.connect() as conn:
        for table in tables_to_count:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"  {table:<25} {count:>5} rows")
            except Exception:
                print(f"  {table:<25}   N/A  (table may not exist)")
except Exception as e:
    print(f"  Row count query failed: {e}")

# ── Step 5: Admin user verification ──────────────────────────────────────────
print("\n" + "-" * 40)
print("Admin User Check:")

try:
    with engine.connect() as conn:
        row = conn.execute(
            text("SELECT id, email, full_name, role FROM users WHERE email = 'demo@marketerai.com'")
        ).fetchone()
    
    if row:
        print(f"  ✓ Admin found: id={row[0]}, name='{row[2]}', role={row[3]}")
        
        # Verify password hash
        from app.core.security import verify_password
        hash_row = conn.execute(
            text("SELECT hashed_password FROM users WHERE email = 'demo@marketerai.com'")
        ) if False else None
        
        with engine.connect() as conn2:
            hash_result = conn2.execute(
                text("SELECT hashed_password FROM users WHERE email = 'demo@marketerai.com'")
            ).scalar()
        
        if verify_password("demo1234", hash_result):
            print("  ✓ Password 'demo1234' verified ✓")
        else:
            print("  ✗ Password hash is invalid! The startup seed will fix this automatically.")
    else:
        print("  ✗ Admin user NOT found. It will be created automatically on next startup.")

except Exception as e:
    print(f"  Admin check failed: {e}")

# ── Done ──────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("  Verification complete. Check results above.")
print("=" * 60 + "\n")
