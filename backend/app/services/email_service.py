"""
EmailService — sends transactional emails via SMTP.

Configure via environment variables:
  SMTP_HOST      e.g. smtp.gmail.com
  SMTP_PORT      e.g. 587  (TLS) or 465 (SSL)
  SMTP_USER      your SMTP login / email address
  SMTP_PASSWORD  your SMTP password or app-password
  SMTP_FROM      display address (defaults to SMTP_USER)
  SMTP_TLS       "true" (default) — use STARTTLS; set "false" for SSL-only

When SMTP_HOST is not set the service logs a warning and silently skips sending.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

logger = logging.getLogger(__name__)

APP_NAME = "MarketerAI"


def _smtp_settings():
    host = os.environ.get("SMTP_HOST", "").strip()
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "").strip()
    password = os.environ.get("SMTP_PASSWORD", "").strip()
    from_addr = os.environ.get("SMTP_FROM", user).strip() or user
    use_tls = os.environ.get("SMTP_TLS", "true").lower() != "false"
    return host, port, user, password, from_addr, use_tls


def send_email(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """
    Send a single email. Returns True on success, False on failure.
    Silently skips (returns False) when SMTP is not configured.
    """
    host, port, user, password, from_addr, use_tls = _smtp_settings()

    if not host:
        logger.info(
            f"[Email] SMTP not configured — skipping email to {to_email} (subject: {subject})"
        )
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{APP_NAME} <{from_addr}>"
        msg["To"] = to_email

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if use_tls:
            smtp = smtplib.SMTP(host, port, timeout=15)
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
        else:
            smtp = smtplib.SMTP_SSL(host, port, timeout=15)

        if user and password:
            smtp.login(user, password)

        smtp.sendmail(from_addr, [to_email], msg.as_string())
        smtp.quit()

        logger.info(f"[Email] Sent '{subject}' → {to_email}")
        return True

    except Exception as exc:
        logger.error(f"[Email] Failed to send '{subject}' to {to_email}: {exc}")
        return False


# ─── Email templates ──────────────────────────────────────────────────────────

def _base_template(content: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{APP_NAME}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           background: #f3f4f6; margin: 0; padding: 20px; }}
    .card {{ max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px;
             box-shadow: 0 2px 16px rgba(0,0,0,.08); overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #6c3aff 0%, #9f6fff 100%);
               padding: 32px 36px; text-align: center; }}
    .header h1 {{ margin: 0; color: #fff; font-size: 22px; letter-spacing: -.3px; }}
    .header p {{ margin: 6px 0 0; color: rgba(255,255,255,.85); font-size: 13px; }}
    .body {{ padding: 32px 36px; color: #374151; font-size: 15px; line-height: 1.6; }}
    .body h2 {{ margin: 0 0 12px; color: #111827; font-size: 18px; }}
    .btn {{ display: inline-block; margin-top: 20px; padding: 12px 28px;
            background: #6c3aff; color: #fff; border-radius: 10px; text-decoration: none;
            font-weight: 600; font-size: 14px; }}
    .info-box {{ background: #f9fafb; border-left: 4px solid #6c3aff;
                 border-radius: 8px; padding: 14px 18px; margin: 18px 0;
                 font-size: 14px; color: #4b5563; }}
    .footer {{ padding: 18px 36px; background: #f9fafb; font-size: 12px;
               color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>⚡ {APP_NAME}</h1>
      <p>Your AI Marketing Consultant</p>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      © {datetime.utcnow().year} {APP_NAME}. You're receiving this because you have an account with us.
    </div>
  </div>
</body>
</html>"""


def send_trial_expiry_warning(
    to_email: str,
    full_name: str,
    hours_remaining: int,
    plan_url: str = "",
) -> bool:
    """Send a warning email when a user's trial is about to expire."""
    label = "1 day" if hours_remaining <= 24 else f"{hours_remaining} hours"
    upgrade_link = plan_url or "https://marketerai.replit.app/subscription"

    content = f"""
      <h2>Your free trial expires in {label} ⏰</h2>
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>
        Your {APP_NAME} free trial is ending soon. Don't lose access to your
        AI-powered marketing tools — upgrade today to keep your momentum going.
      </p>
      <div class="info-box">
        <strong>Trial expires in:</strong> {label}<br>
        <strong>What you'll lose:</strong> SEO audits, social analytics, strategy generation
      </div>
      <p>
        Upgrading takes less than a minute. Choose the plan that fits your business
        and stay in control of your marketing.
      </p>
      <a class="btn" href="{upgrade_link}">Upgrade Now →</a>
      <p style="margin-top:24px; font-size:13px; color:#9ca3af;">
        Already upgraded? Ignore this email — you're all set.
      </p>
    """

    text = (
        f"Hi {full_name},\n\n"
        f"Your {APP_NAME} free trial expires in {label}.\n"
        f"Upgrade here to keep your access: {upgrade_link}\n\n"
        f"The {APP_NAME} Team"
    )

    return send_email(
        to_email,
        f"⏰ Your {APP_NAME} trial expires in {label} — upgrade now",
        _base_template(content),
        text,
    )


def send_payment_approved(
    to_email: str,
    full_name: str,
    plan_name: str,
    amount: float,
    valid_until: str = "",
) -> bool:
    """Send a payment-approved confirmation email."""
    plan_display = (plan_name or "Premium").replace("_", " ").title()
    amount_display = f"₹{amount:,.0f}" if amount else ""
    validity_line = (
        f"<br><strong>Access valid until:</strong> {valid_until}" if valid_until else ""
    )

    content = f"""
      <h2>Payment approved — welcome aboard! 🎉</h2>
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>
        Great news! Your payment has been verified and your
        <strong>{plan_display}</strong> subscription is now active.
      </p>
      <div class="info-box">
        <strong>Plan:</strong> {plan_display}<br>
        {f"<strong>Amount:</strong> {amount_display}<br>" if amount_display else ""}
        <strong>Status:</strong> Active ✓
        {validity_line}
      </div>
      <p>
        Log in to your dashboard to access AI marketing strategy, SEO audits,
        social media analytics, and more.
      </p>
      <a class="btn" href="https://marketerai.replit.app/dashboard">Go to Dashboard →</a>
    """

    text = (
        f"Hi {full_name},\n\n"
        f"Your payment for {plan_display} has been approved.\n"
        f"Your subscription is now active.\n\n"
        f"Log in at https://marketerai.replit.app/dashboard\n\n"
        f"The {APP_NAME} Team"
    )

    return send_email(
        to_email,
        f"✅ Payment approved — your {plan_display} plan is active!",
        _base_template(content),
        text,
    )


def send_payment_rejected(
    to_email: str,
    full_name: str,
    plan_name: str,
    reason: str = "",
) -> bool:
    """Send a payment-rejected notification email."""
    plan_display = (plan_name or "Premium").replace("_", " ").title()
    reason_line = (
        f'<div class="info-box"><strong>Reason:</strong> {reason}</div>'
        if reason
        else ""
    )

    content = f"""
      <h2>Payment could not be verified 😔</h2>
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>
        Unfortunately we were unable to verify your payment for the
        <strong>{plan_display}</strong> plan.
      </p>
      {reason_line}
      <p>
        This can happen if the payment screenshot was unclear or the transaction
        ID didn't match our records. Please try again — if you believe this is an
        error, reply to this email and we'll sort it out.
      </p>
      <a class="btn" href="https://marketerai.replit.app/subscription">Try Again →</a>
    """

    text = (
        f"Hi {full_name},\n\n"
        f"We could not verify your payment for {plan_display}.\n"
        f"Please try again at https://marketerai.replit.app/subscription\n\n"
        f"The {APP_NAME} Team"
    )

    return send_email(
        to_email,
        f"❌ Payment not verified for {plan_display} — please try again",
        _base_template(content),
        text,
    )


def send_trial_started(
    to_email: str,
    full_name: str,
    trial_days: int = 3,
    dashboard_url: str = "",
) -> bool:
    """Send a welcome + trial-started email when a user registers."""
    link = dashboard_url or "https://marketerai.replit.app/dashboard"

    content = f"""
      <h2>Welcome to {APP_NAME}! 🚀</h2>
      <p>Hi <strong>{full_name}</strong>,</p>
      <p>
        Your account is ready. You have a <strong>{trial_days}-day free trial</strong>
        with full access to all AI marketing tools — no credit card required.
      </p>
      <div class="info-box">
        ✔ AI marketing strategy generation<br>
        ✔ Real-time SEO audits<br>
        ✔ Social media analytics<br>
        ✔ Automated growth recommendations
      </div>
      <a class="btn" href="{link}">Start Exploring →</a>
      <p style="margin-top:24px; font-size:13px; color:#9ca3af;">
        Your trial lasts {trial_days} days. After that you can upgrade to continue using {APP_NAME}.
      </p>
    """

    text = (
        f"Hi {full_name},\n\n"
        f"Welcome to {APP_NAME}! Your {trial_days}-day free trial is now active.\n"
        f"Get started at: {link}\n\n"
        f"The {APP_NAME} Team"
    )

    return send_email(
        to_email,
        f"🚀 Welcome to {APP_NAME} — your {trial_days}-day trial has started!",
        _base_template(content),
        text,
    )
