"""Diagnostic script to verify auth flow"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import bcrypt
import psycopg2

DB_URL = "postgresql://postgres:postgres@localhost:5432/ai_marketing"

def main():
    print("=" * 60)
    print("AUTH DIAGNOSTIC REPORT")
    print("=" * 60)

    # 1. Test DB connection
    print("\n[1] Testing PostgreSQL connection...")
    try:
        conn = psycopg2.connect(DB_URL)
        print("    [OK] PostgreSQL connection successful")
    except Exception as e:
        print(f"    [FAIL] PostgreSQL connection FAILED: {e}")
        return

    cur = conn.cursor()

    # 2. Check if demo@marketerai.com exists
    print("\n[2] Checking demo@marketerai.com user...")
    cur.execute("SELECT id, email, full_name, role, hashed_password FROM users WHERE email = %s", ("demo@marketerai.com",))
    row = cur.fetchone()
    if row:
        user_id, email, full_name, role, hashed_pw = row
        print(f"    [OK] User found: id={user_id}, name={full_name}, role={role}")
        print(f"    Hash (first 30): {hashed_pw[:30]}...")

        # 3. Verify password
        print("\n[3] Verifying password 'demo1234'...")
        try:
            matches = bcrypt.checkpw("demo1234".encode("utf-8"), hashed_pw.encode("utf-8"))
            if matches:
                print("    [OK] Password 'demo1234' is CORRECT")
            else:
                print("    [FAIL] Password 'demo1234' does NOT match stored hash")
                print("    -> Will rehash password...")
                new_hash = bcrypt.hashpw("demo1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                cur.execute("UPDATE users SET hashed_password = %s WHERE email = %s", (new_hash, "demo@marketerai.com"))
                conn.commit()
                print("    [OK] Password rehashed and updated")
        except Exception as e:
            print(f"    [FAIL] bcrypt verification error: {e}")
            print("    -> Rehashing password...")
            new_hash = bcrypt.hashpw("demo1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            cur.execute("UPDATE users SET hashed_password = %s WHERE email = %s", (new_hash, "demo@marketerai.com"))
            conn.commit()
            print("    [OK] Password rehashed and updated")
    else:
        print("    [FAIL] User NOT found -- creating now...")
        new_hash = bcrypt.hashpw("demo1234".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        cur.execute(
            "INSERT INTO users (email, full_name, hashed_password, role) VALUES (%s, %s, %s, %s)",
            ("demo@marketerai.com", "Demo Admin", new_hash, "admin")
        )
        conn.commit()
        print("    [OK] Created demo@marketerai.com with password demo1234")

    # 4. Verify the JWT creation works
    print("\n[4] Testing JWT token creation...")
    try:
        from jose import jwt
        from datetime import datetime, timedelta
        SECRET_KEY = "supersecretkeyforlocaldevelopmentonlychangeinproductionenv"
        ALGORITHM = "HS256"
        expire = datetime.utcnow() + timedelta(minutes=1440)
        token = jwt.encode({"exp": expire, "sub": "2"}, SECRET_KEY, algorithm=ALGORITHM)
        print(f"    [OK] JWT created: {token[:50]}...")
        decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"    [OK] JWT decoded: sub={decoded['sub']}")
    except Exception as e:
        print(f"    [FAIL] JWT error: {e}")

    # 5. Test the full login endpoint
    print("\n[5] Testing login endpoint via HTTP...")
    try:
        import requests
        resp = requests.post(
            "http://localhost:8000/api/auth/login",
            data={"username": "demo@marketerai.com", "password": "demo1234"},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        print(f"    Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"    [OK] Login SUCCESS")
            print(f"    Token: {data.get('access_token', 'N/A')[:50]}...")
            user_data = data.get('user', {})
            print(f"    User email: {user_data.get('email', 'N/A')}")
            print(f"    User role: {user_data.get('role', 'N/A')}")
        else:
            print(f"    [FAIL] Login FAILED: {resp.text}")
    except Exception as e:
        if "ConnectionError" in type(e).__name__ or "Connection" in str(e):
            print("    [WARN] Backend not running on port 8000 -- skipping HTTP test")
        else:
            print(f"    [FAIL] HTTP test error: {e}")

    # 6. List all users
    print("\n[6] All users in database:")
    cur.execute("SELECT id, email, full_name, role FROM users ORDER BY id")
    for r in cur.fetchall():
        print(f"    id={r[0]}, email={r[1]}, name={r[2]}, role={r[3]}")

    conn.close()
    print("\n" + "=" * 60)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    main()
