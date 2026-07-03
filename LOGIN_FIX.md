# Quick Login Fix

## Problem: "Invalid Credentials" Error

### 30-Second Fix

The most common issue is **the backend server is not running**.

### Step 1: Start Backend (Required)

```bash
cd backend
source .venv/bin/activate    # Windows: .venv\Scripts\activate
python init_db.py            # Only needed once
python seed_test_users.py     # Seed test accounts
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for message: `Application startup complete`

### Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

Wait for message: `Local: http://localhost:5000`

### Step 3: Login

Visit `http://localhost:5000` and login with **any** of these:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | admin123 | Admin |
| demo@marketerai.com | demo1234 | Admin |
| rickshii@gmail.com | rickshii123 | User |
| user@example.com | user1234 | User |
| business@example.com | business123 | User |

---

## Automated Setup

If manual steps are tedious, use the startup scripts:

### Linux/Mac
```bash
./start.sh
```

### Windows
```cmd
start.bat
```

Both scripts:
- Start backend on port 8000
- Start frontend on port 5000
- Handle all setup automatically

---

## Verify Everything Works

### Test Script
```bash
python test_login.py
```

This will:
1. Check if backend is running
2. Test all 5 credentials
3. Report which ones work

Expected output:
```
✅ Backend is running on http://localhost:8000
✅ admin@example.com | LOGIN SUCCESS
✅ demo@marketerai.com | LOGIN SUCCESS
✅ rickshii@gmail.com | LOGIN SUCCESS
✅ user@example.com | LOGIN SUCCESS
✅ business@example.com | LOGIN SUCCESS
```

---

## If It Still Doesn't Work

### 1. Check Backend is Running
```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "message": "Backend is running",
  "database": "connected"
}
```

If this fails → Backend is not running. Go back to Step 1.

### 2. Reseed Test Users
```bash
cd backend
source .venv/bin/activate
python seed_test_users.py
```

### 3. Clear Browser Cache
```javascript
// Paste in browser console (F12)
localStorage.clear(); sessionStorage.clear(); location.reload();
```

### 4. Check Network in DevTools
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try login
4. Look for `/api/auth/login` request
5. Check response (should be 200 with token)

---

## Architecture

```
Frontend (React)        Backend (FastAPI)
Port 5000       ←→     Port 8000
    ↓                      ↓
 Vite Proxy          SQLite Database
```

The frontend proxies `/api` requests to the backend.
Both must be running for login to work.

---

## Need Help?

See detailed guides:
- `AUTH_TROUBLESHOOTING.md` - Comprehensive troubleshooting
- `GETTING_STARTED.md` - Full setup guide
- `RUNTIME_FIXES.md` - All runtime issues

---

**TL;DR:** Run `./start.sh` (or `start.bat`), wait 10 seconds, visit http://localhost:5000, and login! 🚀
