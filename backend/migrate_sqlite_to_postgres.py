#!/usr/bin/env python3
"""
migrate_sqlite_to_postgres.py
─────────────────────────────
Copies ALL users from the local SQLite database into the production PostgreSQL
database WITHOUT overwriting existing accounts (safe to run multiple times).

Usage:
    python migrate_sqlite_to_postgres.py

Set DATABASE_URL in your .env (or as an env var) before running.
The script reads from the local ai_marketing.db SQLite file.
"""

import os
import sys
import sqlite3
from datetime import datetime

# ── Load .env before importing settings ───────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("\n" + "=" * 60)
print("  SQLite → PostgreSQL User Migration")
print("=" * 60)

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "ai_marketing.db")

if not os.path.exists(SQLITE_PATH):
    print(f"\n✗ SQLite database not found at: {SQLITE_PATH}")
    sys.exit(1)

# ── Read ALL users from SQLite ────────────────────────────────────────────────
print(f"\n[1] Reading users from SQLite: {SQLITE_PATH}")
try:
    sqlite_conn = sqlite3.connect(SQLITE_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    cursor.execute("SELECT id, email, full_name, role, hashed_password, avatar_url, created_at FROM users ORDER BY id")
    sqlite_users = cursor.fetchall()
    sqlite_conn.close()
    print(f"    Found {len(sqlite_users)} users in SQLite")
    for u in sqlite_users:
        print(f"    • {u['email']} ({u['role']})")
except Exception as e:
    print(f"✗ Failed to read SQLite: {e}")
    sys.exit(1)

# ── Connect to PostgreSQL ─────────────────────────────────────────────────────
print(f"\n[2] Connecting to PostgreSQL …")
try:
    from app.core.config import settings
    from app.core.database import engine, Base, SessionLocal
    from app.models.user import User
    from app.models.subscription import TrialHistory
    from sqlalchemy import text
    from datetime import timedelta

    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("    ✓ Connected to PostgreSQL")
except Exception as e:
    print(f"    ✗ PostgreSQL connection failed: {e}")
    print("\n    Make sure DATABASE_URL is set in backend/.env")
    sys.exit(1)

# ── Migrate users ─────────────────────────────────────────────────────────────
print(f"\n[3] Migrating users …")
db = SessionLocal()
migrated = 0
skipped = 0
errors = 0

try:
    for u in sqlite_users:
        email = u["email"]
        existing = db.query(User).filter(User.email == email).first()

        if existing:
            print(f"    ⬜ SKIP  {email} (already exists in PostgreSQL, id={existing.id})")
            skipped += 1
            continue

        try:
            # Parse created_at
            created_at = None
            if u["created_at"]:
                try:
                    created_at = datetime.fromisoformat(str(u["created_at"]))
                except Exception:
                    created_at = datetime.utcnow()

            new_user = User(
                email=email,
                full_name=u["full_name"] or email.split("@")[0],
                hashed_password=u["hashed_password"],
                role=u["role"] or "user",
                avatar_url=u["avatar_url"],
                created_at=created_at or datetime.utcnow(),
            )
            db.add(new_user)
            db.flush()  # get the new ID

            # Give migrated users a 30-day trial (so they have access)
            trial = TrialHistory(
                user_id=new_user.id,
                start_date=datetime.utcnow(),
                expiry_date=datetime.utcnow() + timedelta(days=30),
            )
            db.add(trial)
            db.commit()
            db.refresh(new_user)

            print(f"    ✅ ADDED {email} → id={new_user.id} (role={new_user.role})")
            migrated += 1

        except Exception as e:
            db.rollback()
            print(f"    ✗ ERROR  {email}: {e}")
            errors += 1

finally:
    db.close()

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'=' * 60}")
print(f"  Migration Complete")
print(f"  ✅ Migrated : {migrated}")
print(f"  ⬜ Skipped  : {skipped} (already existed)")
print(f"  ✗ Errors   : {errors}")
print(f"{'=' * 60}")

if migrated > 0:
    print("\n✓ Users can now log in using their original passwords.")
    print("  If they forgot their password, use the 'Forgot Password' link.")
print()
