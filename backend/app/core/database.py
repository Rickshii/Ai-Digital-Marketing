"""
Database engine configuration for Supabase PostgreSQL (or local PostgreSQL).

Supabase requires SSL; the DATABASE_URL from Supabase dashboard already includes
?sslmode=require in most cases. We pass pool_pre_ping=True so SQLAlchemy tests
connections before handing them back, which avoids stale-connection errors.
"""

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger("uvicorn.error")

# ── Resolve the DATABASE_URL ─────────────────────────────────────────────────
# Supabase PostgreSQL URLs look like:
#   postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
# Railway / Render provide a similar postgresql:// URL.
# SQLAlchemy requires "postgresql+psycopg2://" (or just "postgresql://") NOT
# the "postgres://" form that some platforms emit.
db_url = settings.DATABASE_URL

# Fix Heroku-style "postgres://" → "postgresql://"
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
    logger.info("[DB] Corrected legacy 'postgres://' → 'postgresql://'")

# ── Engine kwargs ─────────────────────────────────────────────────────────────
# For Supabase / cloud PostgreSQL, use a small connection pool with keep-alive
# checks. Do NOT add check_same_thread (that's SQLite-only).
engine_kwargs = {
    "pool_pre_ping": True,        # detects & drops stale connections
    "pool_recycle": 1800,         # recycle connections every 30 min
    "pool_size": 5,               # maintain up to 5 connections
    "max_overflow": 10,           # allow up to 10 extra connections
}

# ── SQLite fallback (local dev only) ─────────────────────────────────────────
_using_sqlite = False
if settings.USE_SQLITE_FALLBACK:
    logger.info("[DB] USE_SQLITE_FALLBACK=true — attempting PostgreSQL first …")
    try:
        _test_engine = create_engine(db_url, pool_pre_ping=True,
                                     connect_args={"connect_timeout": 5})
        with _test_engine.connect() as _conn:
            _conn.execute(text("SELECT 1"))
        _test_engine.dispose()
        logger.info("[DB] PostgreSQL connection verified ✓")
    except Exception as _e:
        logger.warning(f"[DB] PostgreSQL unavailable ({_e}). Falling back to SQLite.")
        db_url = settings.SQLITE_DATABASE_URL
        engine_kwargs = {}  # SQLite doesn't support pool options
        _using_sqlite = True

if _using_sqlite:
    engine = create_engine(
        db_url,
        connect_args={"check_same_thread": False},
    )
    logger.info(f"[DB] Using SQLite: {db_url}")
else:
    engine = create_engine(db_url, **engine_kwargs)
    logger.info(f"[DB] Engine created for: {db_url.split('@')[-1] if '@' in db_url else db_url}")

# ── Session factory ───────────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ── Declarative base (shared across all models) ───────────────────────────────
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session and closes it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
