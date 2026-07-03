# Getting Started - MarketerAI

## 30-Second Setup

### Linux/Mac
```bash
./start.sh
```

### Windows
```cmd
start.bat
```

Then visit: **http://localhost:5000**

---

## Login Credentials

| Email | Password | Role |
|-------|----------|------|
| `admin@example.com` | `admin123` | Admin |
| `demo@marketerai.com` | `demo1234` | Admin |
| `rickshii@gmail.com` | `rickshii123` | User |
| `user@example.com` | `user1234` | User |

---

## Manual Setup (If Scripts Don't Work)

### Terminal 1 - Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- **App**: http://localhost:5000
- **API Docs**: http://localhost:8000/docs
- **Health**: http://localhost:8000/health

---

## What's Fixed

✅ Backend API server startup  
✅ Database initialization (SQLite)  
✅ CORS configuration  
✅ Frontend build  
✅ Environment variables  
✅ Test account credentials  
✅ Login/authentication flow  
✅ API endpoint routing  

---

## Troubleshooting

**Backend won't start?**
```bash
cd backend
rm -rf .venv
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python init_db.py
```

**Can't login?**
```bash
cd backend
source .venv/bin/activate
python init_db.py  # Reseed database
```

**Port already in use?**
```bash
# Find and kill process using port 8000
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

**Database locked?**
```bash
cd backend
rm ai_marketing.db  # Delete and restart backend
```

---

## Next Steps

1. ✅ Start both servers (see above)
2. ✅ Login with test credentials
3. ✅ Create a business profile
4. ✅ Run website audit
5. ✅ Analyze social media
6. ✅ Generate marketing strategy

---

## Key Files

- `start.sh` / `start.bat` - Startup scripts
- `backend/app/main.py` - FastAPI server
- `frontend/src/App.jsx` - React app
- `backend/init_db.py` - Database setup
- `RUNTIME_FIXES.md` - Detailed fixes
- `BUG_FIXES_SUMMARY.md` - Complete summary

---

## Architecture

```
Frontend (Vite React)
├── Port 5000
├── Vite dev server with HMR
└── Connects to Backend API

Backend (FastAPI)
├── Port 8000
├── RESTful API
├── JWT authentication
├── SQLite database
└── CORS enabled for development
```

---

## Default Ports

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:8000
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

**Having issues?** See `RUNTIME_FIXES.md` for detailed troubleshooting.
