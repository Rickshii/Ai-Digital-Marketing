# Quick Start Guide - Database Fixed ✅

## 1-Minute Setup

### Backend Setup
```bash
cd backend
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload
```

Backend will run at: **http://localhost:8000**

### Frontend Setup (New Terminal)
```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: **http://localhost:3000**

---

## Test Login

- **Email**: `admin@example.com`
- **Password**: `admin123`

---

## API Documentation

Once the backend is running, visit:
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## What Was Fixed

✅ **Database Connection Errors** - Now uses SQLite for local development  
✅ **Missing Tables** - All 12 tables automatically created  
✅ **No Admin User** - Auto-created with test credentials  
✅ **Environment Config** - Proper `.env` setup included  

---

## Database Status

- **Type**: SQLite (local development)
- **Location**: `backend/ai_marketing.db`
- **Size**: 132KB
- **Tables**: 12 (fully initialized)
- **Admin User**: ✅ Created

---

## Troubleshooting

**Issue**: Database errors  
**Solution**: Run `python init_db.py`

**Issue**: Port already in use  
**Solution**: Change port: `uvicorn app.main:app --port 8001`

**Issue**: Missing dependencies  
**Solution**: Run `pip install -r requirements.txt`

---

## Full Documentation

See `DATABASE_FIX_GUIDE.md` for:
- Complete setup instructions
- Production deployment
- Troubleshooting
- Configuration options

---

**Everything is ready to go!** 🚀
