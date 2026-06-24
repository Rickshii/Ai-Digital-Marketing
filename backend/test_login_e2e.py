"""End-to-end login test mimicking exactly what the frontend does"""
import requests

API_URL = "http://localhost:8000/api"

print("=" * 60)
print("FRONTEND LOGIN SIMULATION")
print("=" * 60)

# Step 1: Health check
print("\n[1] Health check...")
try:
    r = requests.get(f"{API_URL}/auth/health", timeout=5)
    print(f"    Status: {r.status_code}")
    print(f"    Response: {r.json()}")
except Exception as e:
    print(f"    FAILED: {e}")

# Step 2: Login as demo@marketerai.com (form-encoded, like frontend)
print("\n[2] Login (form-encoded)...")
try:
    r = requests.post(
        f"{API_URL}/auth/login",
        data={"username": "demo@marketerai.com", "password": "demo1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    print(f"    Status: {r.status_code}")
    data = r.json()
    if r.status_code == 200:
        token = data["access_token"]
        user = data["user"]
        print(f"    [OK] Login SUCCESS")
        print(f"    Token: {token[:60]}...")
        print(f"    User: email={user['email']}, name={user['full_name']}, role={user['role']}")

        # Step 3: Use token to call /auth/me
        print("\n[3] GET /auth/me with token...")
        r2 = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        print(f"    Status: {r2.status_code}")
        if r2.status_code == 200:
            me = r2.json()
            print(f"    [OK] Authenticated user: {me['email']}, role={me['role']}")
        else:
            print(f"    FAILED: {r2.text}")

        # Step 4: Test subscription status (what frontend calls after login)
        print("\n[4] GET /subscription/status...")
        r3 = requests.get(
            f"{API_URL}/subscription/status",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10,
        )
        print(f"    Status: {r3.status_code}")
        if r3.status_code == 200:
            status = r3.json()
            print(f"    [OK] Access: has_access={status.get('has_access')}, role={status.get('role')}")
        else:
            print(f"    Response: {r3.text[:200]}")
    else:
        print(f"    FAILED: {data}")
except Exception as e:
    print(f"    FAILED: {e}")

# Step 5: Test login with JSON body (alternate path)
print("\n[5] Login (JSON body)...")
try:
    r = requests.post(
        f"{API_URL}/auth/login",
        json={"username": "demo@marketerai.com", "password": "demo1234"},
        timeout=10,
    )
    print(f"    Status: {r.status_code}")
    if r.status_code == 200:
        print(f"    [OK] JSON login also works")
    else:
        print(f"    Response: {r.json()}")
except Exception as e:
    print(f"    FAILED: {e}")

# Step 6: Test wrong password
print("\n[6] Login with wrong password...")
try:
    r = requests.post(
        f"{API_URL}/auth/login",
        data={"username": "demo@marketerai.com", "password": "wrongpass"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=10,
    )
    print(f"    Status: {r.status_code}")
    print(f"    Response: {r.json()}")
    if r.status_code == 400:
        print(f"    [OK] Correctly rejected wrong password")
except Exception as e:
    print(f"    FAILED: {e}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETE")
print("=" * 60)
