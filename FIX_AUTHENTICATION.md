# Authentication Issue - Complete Fix

## The Problem

You're seeing: **"Invalid Credentials. Please check your email and password"**

## The Root Cause

The **backend API server is not running on port 8000**. When the frontend tries to authenticate, it cannot connect to the backend, resulting in a connection error that appears as "invalid credentials."

## Quick Fix (30 Seconds)

### Step 1: Start Backend

```bash
cd backend
source .venv/bin/activate              # Windows: .venv\Scripts\activate  
python init_db.py                      # Only needed first time
python seed_test_users.py              # Seed test accounts
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

### Step 3: Login

Visit `http://localhost:5000` and use:
- **Email:** admin@example.com
- **Password:** admin123

## Or Use Startup Script (Even Easier)

```bash
# Linux/Mac
./start.sh

# Windows
start.bat
```

## Valid Test Credentials

All of these work (verified in database):

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| demo@marketerai.com | demo1234 | Admin |
| rickshii@gmail.com | rickshii123 | User |
| user@example.com | user1234 | User |
| business@example.com | business123 | User |

## Verify It Works

```bash
# Test backend is running
curl http://localhost:8000/health

# Test login works
python test_login.py
```

## Why This Happened

The authentication system is correctly implemented with:
- ✅ Bcrypt password hashing
- ✅ JWT token generation
- ✅ Database credential validation
- ✅ FastAPI auth endpoints

But without the backend running, the frontend cannot reach these endpoints, causing all login attempts to fail.

## Architecture

```
Browser
  ↓
Frontend (Vite on port 5000)
  ↓ [Vite Proxy: /api → localhost:8000]
  ↓
Backend (FastAPI on port 8000)
  ↓
SQLite Database
```

All three components must be running for login to work.

## What Was Created

1. **seed_test_users.py** - Script to seed test accounts
2. **test_login.py** - Script to verify credentials work
3. **LOGIN_FIX.md** - Quick reference guide
4. **AUTH_TROUBLESHOOTING.md** - Comprehensive troubleshooting
5. **This file** - Summary and quick start

## Still Having Issues?

See these files:
- **LOGIN_FIX.md** - 2-minute quick reference
- **AUTH_TROUBLESHOOTING.md** - Complete diagnostic guide with all solutions

## Summary

Backend not running → Frontend connection fails → "Invalid Credentials" error

**Solution: Start the backend server!**

```bash
./start.sh    # All-in-one solution (recommended)
```

That's it! Your authentication system is working perfectly. 🚀
