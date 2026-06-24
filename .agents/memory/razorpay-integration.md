---
name: Razorpay Payment Integration
description: Razorpay key detection, mock fallback, webhook, and HMAC verification
---

Key detection in `subscription.py`: `is_configured = bool(key_id and key_secret and key_id not in ("rzp_test_dummy", "dummy_key"))`. Empty strings count as not configured.

When not configured: `create-order` returns `{"is_mock": True}`. Frontend detects this and switches to QR payment flow automatically.

When configured: creates real Razorpay order, frontend opens Razorpay checkout modal. On success, calls `/api/subscription/verify-payment` with order_id, payment_id, signature.

HMAC verification: `hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()`. Python `hmac.new()` is correct syntax.

Webhook: `POST /api/subscription/webhook/razorpay` — verifies `X-Razorpay-Signature` header, activates subscription on `payment.captured` event. Notes in Razorpay order must include `user_id` and `plan_name`.

Frontend API_BASE fix: `import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ?? ''` — avoids window.location.hostname:8000 which breaks in Replit's proxied iframe.

**Why:** Original code used `hmac.new` correctly but had broken key check (didn't handle empty strings). The window.location.hostname:8000 URL is wrong in proxied Replit environments.
