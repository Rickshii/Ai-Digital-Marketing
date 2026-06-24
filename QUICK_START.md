## Environment variables & database configuration

This project uses environment variables for configuration. Copy the example env file and adjust for local development:

1. Copy the template:
   cp .env.example .env

2. Local development options:
   - Use Postgres running on localhost (default in .env.example)
   - Or enable SQLite fallback for quick local starts:
     - Set USE_SQLITE_FALLBACK=true in .env
     - The app will use the bundled SQLite DB at `./ai_marketing.db`

3. Railway deployment:
   - In Railway, set `DATABASE_URL` to the provided Railway Postgres URL (for example: `postgresql://postgres:<PASSWORD>@postgres.railway.internal:5432/ai_marketing`).
   - Keep `USE_SQLITE_FALLBACK=false` in production.
   - Do not commit secrets (SECRET_KEY, DB credentials). Use Railway environment variables.

4. Running the app:
   - After configuring env vars, run migrations (follow the project's migration step; e.g., `alembic upgrade head` if applicable).
   - Start the backend (example): `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
   - Start the frontend per the frontend/README.md instructions.
