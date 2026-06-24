# AI Digital Marketing Consultant SaaS Platform (MarketerAI)

## Overview

An AI-powered SaaS platform for digital marketing consultancy. It provides SEO audits, social media analysis, marketing strategy generation, and subscription management with a Razorpay payment integration.

## Architecture

- **Frontend**: React 19 + Vite (port 5000 in dev), Tailwind CSS, React Router DOM, Axios
- **Backend**: FastAPI (Python), runs on port 8000 in dev, port 5000 in production
- **Database**: PostgreSQL (Replit managed, via `DATABASE_URL` secret)
- **Auth**: JWT Bearer tokens (no cookies)

## Development Setup

Two workflows run in parallel:
1. **Start application** — `cd frontend && npm run dev` (port 5000, webview)
2. **Backend API** — `cd backend && uvicorn app.main:app --host localhost --port 8000 --reload` (port 8000, console)

The Vite dev server proxies `/api/*` requests to `http://localhost:8000`.

## Production Deployment

- Build: `cd frontend && npm install && npm run build`
- Run: `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 5000`
- The FastAPI backend serves the built React `frontend/dist` as static files and handles the SPA catch-all route.

## Default Credentials (seeded on startup)

- Admin: `demo@marketerai.com` / `demo1234`
- User: `user@example.com` / `user1234`

## Key Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (runtime-managed by Replit)
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — optional, for payment features

## User Preferences

- Keep frontend on port 5000, backend on port 8000 in development.
