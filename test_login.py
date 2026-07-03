#!/usr/bin/env python3
"""
Simple test script to verify login credentials work.
Useful for debugging authentication issues.
"""

import requests
import json
import sys

# Test credentials
TEST_CREDENTIALS = [
    ("admin@example.com", "admin123"),
    ("demo@marketerai.com", "demo1234"),
    ("rickshii@gmail.com", "rickshii123"),
    ("user@example.com", "user1234"),
    ("business@example.com", "business123"),
]

def test_backend_running():
    """Check if backend is running."""
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✅ Backend is running on http://localhost:8000")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is NOT running on http://localhost:8000")
        print("   Start backend with: uvicorn app.main:app --reload")
        return False
    except Exception as e:
        print(f"❌ Error checking backend: {e}")
        return False


def test_login(email, password):
    """Test login with given credentials."""
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token", "")
            print(f"✅ {email:<30} | LOGIN SUCCESS")
            if token:
                print(f"   Token: {token[:50]}...")
            return True
        else:
            detail = response.json().get("detail", "Unknown error")
            print(f"❌ {email:<30} | {detail}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ {email:<30} | Cannot connect to backend")
        return False
    except Exception as e:
        print(f"❌ {email:<30} | Error: {e}")
        return False


def main():
    print("\n" + "=" * 80)
    print("LOGIN CREDENTIALS TESTER")
    print("=" * 80)
    
    # Check if backend is running
    print("\n1. Checking if backend is running...")
    if not test_backend_running():
        print("\n⚠️  Backend is not running!")
        print("   To start backend:")
        print("   cd backend")
        print("   source .venv/bin/activate")
        print("   uvicorn app.main:app --reload")
        sys.exit(1)
    
    # Test credentials
    print("\n2. Testing login credentials...")
    print("-" * 80)
    
    passed = 0
    failed = 0
    
    for email, password in TEST_CREDENTIALS:
        if test_login(email, password):
            passed += 1
        else:
            failed += 1
    
    print("-" * 80)
    
    # Summary
    print(f"\n3. Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("\n✅ All credentials are working!")
        print("\n   You can now login with any of these:")
        for email, password in TEST_CREDENTIALS:
            print(f"   • {email} / {password}")
    else:
        print(f"\n❌ {failed} credential(s) failed")
        print("\n   Run this to reseed test users:")
        print("   python backend/seed_test_users.py")
    
    print("\n" + "=" * 80)
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        sys.exit(1)
