---
name: Trial Duration Policy
description: All new users get a 3-day free trial; existing 30-day seeded trials must be patched
---

`access_service.py` — `TRIAL_DURATION_DAYS = 3` constant used in `start_trial()`.
`main.py` — seeding function uses `timedelta(days=3)`.

If a database was already seeded with 30-day trials, run this to fix existing users:
```python
from app.models.subscription import TrialHistory
from app.models.user import User
from datetime import timedelta
users = db.query(User).filter(User.role != 'admin').all()
for u in users:
    trial = db.query(TrialHistory).filter(TrialHistory.user_id == u.id).first()
    if trial:
        correct_expiry = trial.start_date + timedelta(days=3)
        if trial.expiry_date > correct_expiry:
            trial.expiry_date = correct_expiry
db.commit()
```

**Why:** Trial was originally 30 days in the seeding code but policy requires 3 days.
