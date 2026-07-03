# API Configuration - Quick Fix

## The Problem
```
Error: "API endpoint rejected the request method"
```

## Root Cause
Frontend's VITE_API_URL was not configured correctly.

## What Was Fixed (3 Changes)

### 1. Created `frontend/.env`
```env
VITE_API_URL=http://localhost:8000
NODE_ENV=development
```

### 2. Created `frontend/.env.example`
Reference documentation for environment variables.

### 3. Fixed `frontend/src/services/api.js`
Changed login to use correct API client:
```javascript
// BEFORE (wrong - form-urlencoded, direct axios)
const formData = new URLSearchParams();
formData.append('username', email);
const response = await axios.post(`${API_URL}/auth/login`, formData, {
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
});

// AFTER (correct - JSON, api instance)
const response = await api.post('/auth/login', {
  username: email,
  email: email,
  password: password,
});
```

## How It Works Now

1. Frontend running on `http://localhost:5000`
2. Vite proxy intercepts requests to `/api/*`
3. Redirects them to `http://localhost:8000/api/*`
4. Backend processes request and returns response
5. Frontend receives data

## Quick Start

### Step 1: Verify Files Exist
```bash
# Check .env file was created
cat frontend/.env

# Output should be:
# VITE_API_URL=http://localhost:8000
# NODE_ENV=development
```

### Step 2: Start Servers
```bash
# Terminal 1 - Backend
cd backend
source .venv/bin/activate
python init_db.py  # Only if first time
python seed_test_users.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm install  # Only if first time
npm run dev
```

### Step 3: Test Login
Visit `http://localhost:5000` and login with:
- Email: `admin@example.com`
- Password: `admin123`

## Verification

### Check Backend Running
```bash
curl http://localhost:8000/health
# Output: {"status": "healthy", ...}
```

### Check Frontend Running
```bash
curl http://localhost:5000
# Output: HTML content
```

### Test Login Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
# Output: {"access_token": "...", "token_type": "bearer", ...}
```

## Common Errors & Fixes

### Error: "API endpoint rejected the request method"
**Fix**: 
- ✅ Restart frontend: `npm run dev`
- ✅ Clear browser cache: `Ctrl+Shift+Delete`
- ✅ Check backend is running: `curl http://localhost:8000/health`

### Error: "Cannot POST /api/auth/login"
**Fix**:
- ✅ Backend not running? Start with: `uvicorn app.main:app --reload`
- ✅ Check VITE_API_URL: `cat frontend/.env`

### Error: "Invalid credentials"
**Fix**:
- ✅ Check backend is running
- ✅ Check test users were seeded: `python seed_test_users.py`
- ✅ Try with: `admin@example.com` / `admin123`

## Environment Variables Reference

| Variable | Development | Production |
|----------|-------------|-----------|
| VITE_API_URL | http://localhost:8000 | https://your-backend.up.railway.app |
| NODE_ENV | development | production |

## Files Changed

- ✅ `frontend/.env` - NEW
- ✅ `frontend/.env.example` - NEW
- ✅ `frontend/src/services/api.js` - MODIFIED (login endpoint)
- ✅ `frontend/vite.config.js` - NO CHANGES (already correct)

## Status: FIXED ✅

The API configuration is now correct. Login requests will:
1. Go to frontend proxy (`/api/auth/login`)
2. Get redirected to backend (`http://localhost:8000/api/auth/login`)
3. Backend processes and returns JWT token
4. Frontend stores token in localStorage
5. User is authenticated

Try logging in now with: `admin@example.com` / `admin123`
