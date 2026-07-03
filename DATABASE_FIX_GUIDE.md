# Database Connection Fix Guide

## Overview

This project uses SQLAlchemy ORM with support for both PostgreSQL (production) and SQLite (local development fallback).

**Status**: ✅ Database is now properly configured and initialized.

---

## Changes Made to Fix Connection Errors

### 1. Environment Configuration
**File**: `.env.development.local`

Added proper database configuration with SQLite fallback for local development:

```env
# Database Configuration - Fixed for Connection Errors
DATABASE_URL=sqlite:///./ai_marketing.db
USE_SQLITE_FALLBACK=true
SQLITE_DATABASE_URL=sqlite:///./ai_marketing.db

# App Configuration
SECRET_KEY=supersecretkeyforlocaldevelopmentonlychangeinproductionenv
```

### 2. Default Configuration
**File**: `backend/app/core/config.py`

Changed the default `USE_SQLITE_FALLBACK` from `False` to `True` to enable automatic fallback:

```python
USE_SQLITE_FALLBACK: bool = True  # Now defaults to True for local development
```

### 3. Database Connection Logic
**File**: `backend/app/core/database.py`

Improved the SQLite fallback logic to handle both configured SQLite URLs and fallback scenarios:

```python
# Now properly detects SQLite URLs and switches modes accordingly
if settings.USE_SQLITE_FALLBACK or db_url.startswith("sqlite://"):
    # Automatic fallback to SQLite if PostgreSQL unavailable
```

### 4. Database Initialization Script
**File**: `backend/init_db.py`

Created a comprehensive database initialization tool that:
- Tests database connectivity
- Creates all tables
- Seeds default subscription plans
- Seeds platform settings
- Creates an admin user for testing

---

## How to Initialize the Database

### Step 1: Set up the Python environment
```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2: Run the initialization script
```bash
python init_db.py
```

Expected output:
```
✓ Database Connection
✓ Create Tables
✓ Seed Plans
✓ Seed Settings
✓ Create Admin
✓ Database initialized successfully!
```

### Step 3: Start the backend server
```bash
uvicorn app.main:app --reload
```

The backend will now automatically:
1. Create any missing tables on startup
2. Perform schema upgrades
3. Seed default admin user if needed
4. Start the trial-expiry email scheduler

---

## Database Configuration Guide

### For Local Development

**Use SQLite (No Setup Required)**:
```env
DATABASE_URL=sqlite:///./ai_marketing.db
USE_SQLITE_FALLBACK=true
```

The database file will be created automatically at `backend/ai_marketing.db`.

### For Production Deployment

#### Railway
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
USE_SQLITE_FALLBACK=false
```

1. Connect PostgreSQL plugin in Railway dashboard
2. Copy the `DATABASE_URL` from the PostgreSQL plugin
3. Set `USE_SQLITE_FALLBACK=false`

#### Supabase
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
USE_SQLITE_FALLBACK=false
```

Get the connection string from Supabase Dashboard → Project Settings → Database → Connection String (URI)

#### AWS Aurora
```env
DATABASE_URL=postgresql://postgres:password@aurora-cluster.xxxxx.us-east-1.rds.amazonaws.com:5432/dbname
USE_SQLITE_FALLBACK=false
```

---

## Troubleshooting

### Issue: "Connection refused" error

**Cause**: PostgreSQL is not running, but SQLite fallback is disabled.

**Solution**:
1. Enable SQLite fallback: `USE_SQLITE_FALLBACK=true`
2. Or start PostgreSQL service
3. Run `python init_db.py` to initialize

### Issue: "Tables don't exist" error

**Cause**: Database was not initialized.

**Solution**:
```bash
python init_db.py
```

This creates all tables and seeds default data.

### Issue: "Admin user not found" error

**Cause**: Initialization wasn't completed.

**Solution**:
```bash
python init_db.py
```

This will create the admin user (email: `admin@example.com`, password: `admin123`).

### Issue: Port 5432 already in use

**Cause**: PostgreSQL is already running from a previous session.

**Solution**:
```bash
# Check what's using port 5432
lsof -i :5432

# Kill the process
kill -9 <PID>

# Or just use SQLite fallback instead
USE_SQLITE_FALLBACK=true
```

### Issue: "Database is locked" (SQLite)

**Cause**: Multiple processes accessing SQLite simultaneously.

**Solution**:
- SQLite works best for single-user local development
- For production, use PostgreSQL
- Ensure only one server instance is running

---

## Database Schema

The project includes the following tables (auto-created):

| Table | Purpose |
|-------|---------|
| `users` | User accounts and authentication |
| `business_profiles` | Client business information |
| `website_audits` | SEO/performance audit results |
| `social_media_analyses` | Social media strategy analysis |
| `marketing_strategies` | Generated marketing strategies |
| `reports` | User-generated reports |
| `subscriptions` | User subscription plans |
| `payments` | Payment transaction records |
| `trial_histories` | Trial period tracking |
| `plan_prices` | Available subscription plans |
| `platform_settings` | Platform-wide configuration |
| `user_access_logs` | User access audit trail |

---

## Default Admin Credentials

After running `python init_db.py`:

- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **IMPORTANT**: Change these credentials before deploying to production!

---

## Key Files Reference

- **Backend Setup**: `backend/app/core/database.py`
- **Configuration**: `backend/app/core/config.py`
- **Models**: `backend/app/models/`
- **Environment**: `.env.development.local`
- **Initialization**: `backend/init_db.py`

---

## Next Steps

1. ✅ Database is initialized
2. Start the backend: `uvicorn app.main:app --reload`
3. Start the frontend: `cd frontend && npm run dev`
4. Access the app at `http://localhost:3000`
5. Login with `admin@example.com` / `admin123` for testing

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the initialization script output for specific errors
3. Check backend logs: `uvicorn app.main:app --reload --log-level debug`
