import sqlite3
import urllib.request
import json

# 1. Check DB tables
conn = sqlite3.connect('ai_marketing.db')
tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
print("=== DB Tables ===")
for t in tables:
    print(" -", t[0])

# 2. Check plan_prices rows
plans = conn.execute("SELECT id, plan_name, price, duration_days FROM plan_prices ORDER BY id").fetchall()
print(f"\n=== plan_prices ({len(plans)} rows) ===")
for p in plans:
    print(f"  id={p[0]} name='{p[1]}' price={p[2]} days={p[3]}")

# 3. Check platform_settings
if any(t[0] == 'platform_settings' for t in tables):
    settings = conn.execute("SELECT key, value FROM platform_settings").fetchall()
    print(f"\n=== platform_settings ({len(settings)} rows) ===")
    for s in settings:
        print(f"  key='{s[0]}' value='{s[1]}'")
else:
    print("\n[WARN] platform_settings table NOT found in DB!")

conn.close()

# 4. Test API endpoints
print("\n=== API Endpoint Tests ===")
try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/subscription/plans", timeout=5) as r:
        data = json.loads(r.read())
        print(f"GET /subscription/plans -> {len(data)} plans: {[p['plan_name'] for p in data]}")
except Exception as e:
    print(f"GET /subscription/plans -> ERROR: {e}")

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/api/subscription/qr-url", timeout=5) as r:
        data = json.loads(r.read())
        print(f"GET /subscription/qr-url -> {data}")
except Exception as e:
    print(f"GET /subscription/qr-url -> ERROR: {e}")

print("\nAll checks complete.")
