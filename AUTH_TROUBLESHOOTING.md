# Authentication Troubleshooting Guide

## Problem: "Invalid Credentials" Error

If you're seeing "Invalid credentials. Please check your email and password" message, follow this guide.

### Quick Diagnosis

1. **Verify the backend server is running**
   ```bash
   curl http://localhost:8000/health
   ```
   If this fails, the backend is not running - see section below.

2. **Check available test accounts**
   ```bash
   # Run from backend directory
   python seed_test_users.py
   ```

### Test Credentials (All Valid)

These credentials have been seeded and verified:

```
Email: admin@example.com
Password: admin123
Role: Admin

Email: demo@marketerai.com
Password: demo1234
Role: Admin

Email: rickshii@gmail.com
Password: rickshii123
Role: User

Email: user@example.com
Password: user1234
Role: User

Email: business@example.com
Password: business123
Role: User
```

## Solution 1: Backend Server Not Running

### The Problem
The most common cause is that the backend API server on port 8000 is not running.

### How to Fix (Linux/Mac/Windows)

**Option A: Use the Startup Script (Recommended)**
```bash
# Linux/Mac
chmod +x start.sh
./start.sh

# Windows
start.bat
```

**Option B: Manual Backend Startup**
```bash
# Terminal 1: Start Backend
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python init_db.py            # Initialize database
python seed_test_users.py     # Seed test users
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Option C: Frontend-Only Development (If Backend Not Available)**
If you can't run the backend locally, you can still develop the frontend by:
1. Mocking the API responses in `src/services/api.js`
2. Using localStorage for testing
3. Creating Mock Service Worker (MSW) handlers

### How to Verify Backend is Running

Check if the backend is accessible:
```bash
curl -v http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "message": "Backend is running",
  "database": "connected"
}
```

## Solution 2: Database Not Initialized

### The Problem
The database exists but test users haven't been seeded.

### How to Fix

```bash
cd backend
source .venv/bin/activate  # Windows: .venv\Scripts\activate
python seed_test_users.py
```

You should see:
```
✓ Created: admin@example.com (password: admin123)
✓ Created: demo@marketerai.com (password: demo1234)
✓ Created: rickshii@gmail.com (password: rickshii123)
✓ Created: user@example.com (password: user1234)
✓ Created: business@example.com (password: business123)
✓ Seeded 5 test users
```

## Solution 3: Incorrect Email/Password Format

### Check These

1. **No spaces in email or password**
   - ❌ " admin@example.com" (has leading space)
   - ✅ "admin@example.com" (correct)

2. **Case sensitive password**
   - ❌ "Admin123" (should be "admin123")
   - ✅ "admin123" (correct)

3. **Verify with backend API directly**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "admin123"}'
   ```

## Solution 4: Frontend Not Connecting to Backend

### The Problem
The frontend is configured to connect to the backend on port 8000.

### Check Vite Proxy

The frontend should proxy `/api` requests to `http://localhost:8000`:
- Frontend runs on: `http://localhost:5000`
- Backend runs on: `http://localhost:8000`
- Vite proxy: `/api` → `http://localhost:8000/api`

### Verify with Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to login
4. Look for request to `/api/auth/login`
5. Check if it's connecting to `http://localhost:8000/api/auth/login`

If you see CORS errors:
- Verify backend is running
- Check CORS is enabled in `backend/app/main.py`

## Solution 5: Token/Session Issues

### Clear Browser Cache

```javascript
// Run in browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Check JWT Token

After successful login, verify the token is stored:

```javascript
// In browser console
console.log(localStorage.getItem('token'))
```

Should print a long string starting with `eyJ...`

## Complete Diagnostic Script

Run this in the backend directory to check everything:

```bash
#!/bin/bash

echo "=== Diagnostic Check ==="
echo ""

# Check Python
echo "1. Python version:"
python --version

# Check venv
echo ""
echo "2. Virtual environment:"
if [ -d ".venv" ]; then
    echo "✓ Virtual environment exists"
else
    echo "✗ Virtual environment missing"
fi

# Check requirements
echo ""
echo "3. Requirements installed:"
pip list | grep -E "fastapi|sqlalchemy|pydantic" || echo "✗ Dependencies not installed"

# Check database
echo ""
echo "4. Database:"
if [ -f "ai_marketing.db" ]; then
    echo "✓ Database file exists"
    echo "Size: $(ls -lh ai_marketing.db | awk '{print $5}')"
else
    echo "✗ Database file missing"
fi

# Check if backend can start
echo ""
echo "5. Backend startup test:"
timeout 5 uvicorn app.main:app --host 0.0.0.0 --port 8000 2>&1 | head -10

# Check API connectivity
echo ""
echo "6. API connectivity:"
curl -s http://localhost:8000/health | jq . 2>/dev/null || echo "✗ Backend not responding"

echo ""
echo "=== End Diagnostic ==="
```

## Common Error Messages

### "Network Error" / "Connection Refused"
- Backend is not running on port 8000
- Solution: Start backend with `uvicorn app.main:app --reload`

### "401 Unauthorized"
- Token is invalid or expired
- Solution: Clear localStorage and login again

### "404 Not Found"
- API endpoint doesn't exist or wrong URL
- Solution: Verify backend is running and check endpoint path

### "500 Internal Server Error"
- Backend error occurred
- Check backend terminal for error logs

## Testing Login Flow

### Step-by-Step Test

1. **Start Backend**
   ```bash
   cd backend
   source .venv/bin/activate
   uvicorn app.main:app --reload
   ```

2. **Open New Terminal and Test API**
   ```bash
   # Test if backend is running
   curl http://localhost:8000/health
   
   # Test login with valid credentials
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "admin123"}'
   ```

3. **Start Frontend (New Terminal)**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test in Browser**
   - Visit http://localhost:5000
   - Try login with admin@example.com / admin123
   - Check DevTools Network tab
   - Verify token in localStorage

## Still Having Issues?

### Check Backend Logs
The backend logs login attempts:
```
[Auth] Login attempt for: admin@example.com
[Auth] Login SUCCESS for 'admin@example.com' (id=1, role=admin)
```

### Reset Everything
```bash
# Delete database and recreate
rm backend/ai_marketing.db

# Reinitialize
cd backend
source .venv/bin/activate
python init_db.py
python seed_test_users.py

# Start fresh
uvicorn app.main:app --reload
```

### Check Python Bcrypt
Password hashing uses bcrypt. Verify it's working:
```bash
python3 << 'EOF'
from app.core.security import verify_password, get_password_hash

# Test password hashing
pwd = "test123"
hashed = get_password_hash(pwd)
print(f"Hashed: {hashed}")
print(f"Valid: {verify_password(pwd, hashed)}")
print(f"Invalid: {verify_password('wrong', hashed)}")
EOF
```

## Getting Help

Check these files for more details:
- `GETTING_STARTED.md` - Quick start guide
- `RUNTIME_FIXES.md` - All runtime issues
- `BUG_FIXES_SUMMARY.md` - Technical summary
- Backend logs: Check terminal where `uvicorn` is running
- Frontend logs: Browser console (F12)

---

**Remember:** Both frontend (port 5000) and backend (port 8000) must be running for login to work!
