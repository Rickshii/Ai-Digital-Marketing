# API Configuration Guide

## VITE_API_URL Configuration Fix

### The Problem You Were Seeing
- **Error**: "API endpoint rejected the request method"
- **Cause**: Missing or incorrect `VITE_API_URL` environment variable in frontend
- **Result**: Frontend couldn't connect to backend API correctly

### What Was Fixed

#### 1. Created `.env` File
**File**: `frontend/.env`
```env
VITE_API_URL=http://localhost:8000
NODE_ENV=development
```

#### 2. Created `.env.example` File
**File**: `frontend/.env.example` (for reference)
- Documents all available environment variables
- Shows examples for local development and production

#### 3. Fixed Login Endpoint
**File**: `frontend/src/services/api.js`
- Changed from `axios.post()` with form-urlencoded
- Now uses `api.post()` with JSON content-type
- Properly sends to `/api/auth/login` endpoint via proxy

### How It Works Now

#### Local Development Flow
```
Frontend (http://localhost:5000)
    ↓
Vite Proxy intercepts /api requests
    ↓
Redirects to http://localhost:8000/api/...
    ↓
Backend FastAPI Server (port 8000)
    ↓
Database Query
    ↓
Response sent back
```

#### Configuration Files

1. **frontend/vite.config.js** - Proxy Configuration
   ```javascript
   server: {
     proxy: {
       '/api': {
         target: 'http://localhost:8000',
         changeOrigin: true,
         secure: false,
       }
     }
   }
   ```

2. **frontend/.env** - Environment Variables
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **frontend/src/services/api.js** - API Client
   ```javascript
   const API_URL = envApiUrl || '/api';
   const api = axios.create({
     baseURL: API_URL,
     headers: {
       'Content-Type': 'application/json',
     },
     timeout: 50000,
   });
   ```

### Environment Setup

#### Local Development
```env
VITE_API_URL=http://localhost:8000
NODE_ENV=development
```

#### Production (Railway/Vercel)
```env
VITE_API_URL=https://your-backend.up.railway.app
NODE_ENV=production
```

### Important Notes

1. **Do NOT use relative paths** in production
   - ❌ VITE_API_URL=/api (will route to Vercel itself)
   - ✅ VITE_API_URL=https://your-backend.up.railway.app

2. **Proxy only works in development**
   - Vite proxy is for local development only
   - Production uses the VITE_API_URL environment variable directly

3. **Environment variables must be set before building**
   - For development: Create `frontend/.env`
   - For production: Set in Vercel/Railway dashboard

### Testing the Configuration

#### Test Backend Connectivity
```bash
curl http://localhost:8000/health
```

#### Test API Endpoint
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

#### Test Frontend Proxy
```bash
# From browser console while on http://localhost:5000
fetch('/api/auth/me', {
  headers: { Authorization: 'Bearer your-token-here' }
})
.then(r => r.json())
.then(console.log)
```

### Troubleshooting

#### Issue: "API endpoint rejected the request method"
**Solution**: Ensure:
- ✅ Backend is running on port 8000
- ✅ VITE_API_URL is set in frontend/.env
- ✅ Content-Type header is application/json
- ✅ Frontend is using the `api` instance, not plain axios

#### Issue: "Cannot reach backend from frontend"
**Solution**: Check:
- ✅ Are both servers running?
  ```bash
  curl http://localhost:5000  # Frontend
  curl http://localhost:8000  # Backend
  ```
- ✅ Is VITE_API_URL correctly set?
  ```bash
  cat frontend/.env
  ```
- ✅ Check browser console for CORS errors
- ✅ Verify vite.config.js proxy configuration

#### Issue: "401 Unauthorized"
**Solution**:
- ✅ Token not being sent in Authorization header
- ✅ Check api.js request interceptor
- ✅ Verify localStorage.getItem('token') returns a valid token

#### Issue: "Production deployment not working"
**Solution**:
- ✅ Set VITE_API_URL in Vercel/Railway environment variables
- ✅ Use full URL: https://your-backend.up.railway.app
- ✅ Verify backend CORS allows your frontend domain
- ✅ Rebuild and redeploy frontend

### Files Modified

1. **frontend/.env** (NEW)
   - Sets VITE_API_URL for local development

2. **frontend/.env.example** (NEW)
   - Reference for environment variables

3. **frontend/src/services/api.js** (MODIFIED)
   - Fixed login endpoint to use api instance
   - Changed from form-urlencoded to JSON
   - Now properly uses proxy in dev mode

### Next Steps

1. Ensure `frontend/.env` is created with correct VITE_API_URL
2. Start backend: `uvicorn app.main:app --reload`
3. Start frontend: `npm run dev`
4. Frontend automatically proxies /api requests to backend
5. Login should now work correctly

### Additional Resources

- Vite Proxy Documentation: https://vitejs.dev/config/server-options.html#server-proxy
- Axios Documentation: https://axios-http.com/
- FastAPI CORS: https://fastapi.tiangolo.com/tutorial/cors/

---

All API configuration issues have been resolved. Login should now work correctly! 🎉
