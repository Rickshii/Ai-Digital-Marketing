"""
Alembic env.py — configured for AI Digital Marketing SaaS Platform.

Reads DATABASE_URL from the application settings (which loads from .env),
and points Alembic's autogenerate at all SQLAlchemy models via Base.metadata.

Usage:
  # Generate a migration after changing a model:
  alembic revision --autogenerate -m "describe your change"

  # Apply pending migrations to the database:
  alembic upgrade head

  # View migration history:
  alembic history
"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# ── Make the app package importable from the alembic/ subdirectory ─────────────
# alembic/ lives inside backend/, so we add backend/ to sys.path.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# ── Load app settings and models ───────────────────────────────────────────────
from app.core.config import settings

# Import ALL models so Alembic can detect schema changes via autogenerate
from app.core.database import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.business import BusinessProfile  # noqa: F401
from app.models.audit import WebsiteAudit  # noqa: F401
from app.models.social_media import SocialMediaAnalysis  # noqa: F401
from app.models.marketing_strategy import MarketingStrategy  # noqa: F401
from app.models.report import Report  # noqa: F401
from app.models.subscription import (  # noqa: F401
    TrialHistory, Subscription, Payment,
    UserAccessLog, PlanPrice, PlatformSettings,
)

# ── Alembic config object ──────────────────────────────────────────────────────
config = context.config

# Set up Python logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Point autogenerate at all registered models
target_metadata = Base.metadata

# Override sqlalchemy.url with our application's DATABASE_URL
# (fixes "postgres://" → "postgresql://" for Heroku/Railway-style URLs)
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
config.set_main_option("sqlalchemy.url", db_url)


# ── Migration runners ──────────────────────────────────────────────────────────

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no live DB connection needed)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (connects to the live database)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
