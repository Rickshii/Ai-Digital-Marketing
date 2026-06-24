"""Initial full schema — all tables for AI Digital Marketing SaaS Platform.

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-06-24

This migration creates all tables from scratch. When you point Alembic at an
existing database (Supabase / Railway) that already has tables, run:

    alembic stamp head

That marks the current state as up-to-date WITHOUT running this migration,
which is the correct approach when tables were created by SQLAlchemy's
create_all() in earlier deployments.
"""

from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = "0001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=True),
        sa.Column("avatar_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    # ── business_profiles ────────────────────────────────────────────────────
    op.create_table(
        "business_profiles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(), nullable=False),
        sa.Column("industry_type", sa.String(), nullable=False),
        sa.Column("website_url", sa.String(), nullable=True),
        sa.Column("business_location", sa.String(), nullable=True),
        sa.Column("target_audience", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("contact_number", sa.String(), nullable=True),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("social_media_links", sa.JSON(), nullable=True),
        sa.Column("business_category", sa.String(), nullable=True),
        sa.Column("business_address", sa.String(), nullable=True),
        sa.Column("city", sa.String(), nullable=True),
        sa.Column("state", sa.String(), nullable=True),
        sa.Column("country", sa.String(), nullable=True),
        sa.Column("pincode", sa.String(), nullable=True),
        sa.Column("google_profile_registered", sa.String(), nullable=True),
        sa.Column("google_maps_link", sa.String(), nullable=True),
        sa.Column("number_of_branches", sa.Integer(), nullable=True),
        sa.Column("branch_locations", sa.Text(), nullable=True),
        sa.Column("whatsapp_number", sa.String(), nullable=True),
        sa.Column("completeness_score", sa.Integer(), nullable=True),
        sa.Column("missing_info_report", sa.JSON(), nullable=True),
        sa.Column("improvement_suggestions", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_business_profiles_id"), "business_profiles", ["id"], unique=False)

    # ── website_audits ───────────────────────────────────────────────────────
    op.create_table(
        "website_audits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("website_url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("health_score", sa.Integer(), nullable=True),
        sa.Column("seo_score", sa.Integer(), nullable=True),
        sa.Column("performance_score", sa.Integer(), nullable=True),
        sa.Column("social_score", sa.Integer(), nullable=True),
        sa.Column("marketing_score", sa.Integer(), nullable=True),
        sa.Column("load_time", sa.String(), nullable=True),
        sa.Column("mobile_friendly", sa.Boolean(), nullable=True),
        sa.Column("secure", sa.Boolean(), nullable=True),
        sa.Column("open_graph", sa.Boolean(), nullable=True),
        sa.Column("suggestions", sa.JSON(), nullable=True),
        sa.Column("raw_data", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_website_audits_id"), "website_audits", ["id"], unique=False)

    # ── social_media_analyses ────────────────────────────────────────────────
    op.create_table(
        "social_media_analyses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("facebook_url", sa.String(), nullable=True),
        sa.Column("instagram_url", sa.String(), nullable=True),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("youtube_url", sa.String(), nullable=True),
        sa.Column("platforms_found", sa.Integer(), nullable=True),
        sa.Column("platforms_analyzed", sa.Integer(), nullable=True),
        sa.Column("social_score", sa.Integer(), nullable=True),
        sa.Column("profile_completeness", sa.Integer(), nullable=True),
        sa.Column("facebook_analysis", sa.JSON(), nullable=True),
        sa.Column("instagram_analysis", sa.JSON(), nullable=True),
        sa.Column("linkedin_analysis", sa.JSON(), nullable=True),
        sa.Column("youtube_analysis", sa.JSON(), nullable=True),
        sa.Column("missing_elements", sa.JSON(), nullable=True),
        sa.Column("growth_suggestions", sa.JSON(), nullable=True),
        sa.Column("analysis_summary", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_social_media_analyses_id"), "social_media_analyses", ["id"], unique=False)

    # ── marketing_strategies ─────────────────────────────────────────────────
    op.create_table(
        "marketing_strategies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("business_profile_id", sa.Integer(), nullable=True),
        sa.Column("strategy_score", sa.Integer(), nullable=True),
        sa.Column("active_tasks", sa.String(), nullable=True),
        sa.Column("reach_estimate", sa.String(), nullable=True),
        sa.Column("projected_roi", sa.String(), nullable=True),
        sa.Column("scores_used", sa.JSON(), nullable=True),
        sa.Column("plan_30_day", sa.JSON(), nullable=True),
        sa.Column("plan_90_day", sa.JSON(), nullable=True),
        sa.Column("branding_strategy", sa.JSON(), nullable=True),
        sa.Column("lead_gen_strategy", sa.JSON(), nullable=True),
        sa.Column("content_strategy", sa.JSON(), nullable=True),
        sa.Column("social_media_strategy", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_marketing_strategies_id"), "marketing_strategies", ["id"], unique=False)

    # ── reports ──────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("report_id", sa.String(), nullable=True),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("type", sa.String(), nullable=True),
        sa.Column("scores", sa.JSON(), nullable=True),
        sa.Column("business_overview", sa.JSON(), nullable=True),
        sa.Column("website_audit", sa.JSON(), nullable=True),
        sa.Column("seo_audit", sa.JSON(), nullable=True),
        sa.Column("social_media_analysis", sa.JSON(), nullable=True),
        sa.Column("marketing_strategy", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_reports_id"), "reports", ["id"], unique=False)
    op.create_index(op.f("ix_reports_report_id"), "reports", ["report_id"], unique=False)

    # ── trial_histories ───────────────────────────────────────────────────────
    op.create_table(
        "trial_histories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("expiry_date", sa.DateTime(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_trial_histories_id"), "trial_histories", ["id"], unique=False)

    # ── subscriptions ─────────────────────────────────────────────────────────
    op.create_table(
        "subscriptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plan_name", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("expiry_date", sa.DateTime(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_subscriptions_id"), "subscriptions", ["id"], unique=False)

    # ── payments ─────────────────────────────────────────────────────────────
    op.create_table(
        "payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("currency", sa.String(), nullable=False),
        sa.Column("razorpay_order_id", sa.String(), nullable=False),
        sa.Column("razorpay_payment_id", sa.String(), nullable=True),
        sa.Column("razorpay_signature", sa.String(), nullable=True),
        sa.Column("payment_method", sa.String(), nullable=False),
        sa.Column("payment_proof", sa.String(), nullable=True),
        sa.Column("plan_name", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_id"), "payments", ["id"], unique=False)
    op.create_index(op.f("ix_payments_razorpay_order_id"), "payments", ["razorpay_order_id"], unique=True)
    op.create_index(op.f("ix_payments_razorpay_payment_id"), "payments", ["razorpay_payment_id"], unique=True)

    # ── user_access_logs ──────────────────────────────────────────────────────
    op.create_table(
        "user_access_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_access_logs_id"), "user_access_logs", ["id"], unique=False)

    # ── plan_prices ───────────────────────────────────────────────────────────
    op.create_table(
        "plan_prices",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("plan_name", sa.String(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("duration_days", sa.Integer(), nullable=False),
        sa.Column("description", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_plan_prices_id"), "plan_prices", ["id"], unique=False)
    op.create_index(op.f("ix_plan_prices_plan_name"), "plan_prices", ["plan_name"], unique=True)

    # ── platform_settings ────────────────────────────────────────────────────
    op.create_table(
        "platform_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("value", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_platform_settings_id"), "platform_settings", ["id"], unique=False)
    op.create_index(op.f("ix_platform_settings_key"), "platform_settings", ["key"], unique=True)


def downgrade() -> None:
    op.drop_table("platform_settings")
    op.drop_table("plan_prices")
    op.drop_table("user_access_logs")
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("trial_histories")
    op.drop_table("reports")
    op.drop_table("marketing_strategies")
    op.drop_table("social_media_analyses")
    op.drop_table("website_audits")
    op.drop_table("business_profiles")
    op.drop_table("users")
