---
name: Special Plan Feature
description: Admin-only plans hidden from public subscription page, assigned directly to users
---

`PlanPrice.is_special` (Boolean, default False) — added via migration in `upgrade_db_schema()`.

Public `/api/subscription/plans` filters `is_special == False`.
Admin `/api/admin/plans` returns all plans including special ones.

Assignment endpoint: `POST /api/admin/users/{user_id}/assign-plan` with body `{"plan_id": int}`.
Calls `AccessService.assign_special_plan()` which creates a fake order ID and skips signature verification.

Frontend: Admin dashboard Plans tab shows "Special" amber badge on is_special plans. Edit plan form has is_special checkbox. User rows have a CreditCard icon button that opens the Assign Plan modal (loads plans on demand if not yet fetched).

**Why:** Special plans are for partner deals, trials, or discounts that admin manually grants — they must never appear on the public pricing page.
