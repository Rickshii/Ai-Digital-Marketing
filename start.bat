@echo off
REM MarketerAI - Windows Local Development Startup Script

setlocal enabledelayedexpansion

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend

echo.
echo ============================================================
echo      MarketerAI - Local Development Startup (Windows)
echo ============================================================
echo.

REM Check for --help flag
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help
if "%1"=="" goto :main
if "%1"=="--backend-only" goto :backend_only
if "%1"=="--frontend-only" goto :frontend_only
if "%1"=="--init-db" goto :init_db

:main
echo [Setup] Starting both servers...
echo.
echo *** IMPORTANT: Read the instructions below ***
echo.
echo You need TWO terminal windows for this to work:
echo.
echo Terminal Window 1 - Backend Server:
echo   cd %BACKEND_DIR%
echo   python -m venv .venv
echo   .venv\Scripts\activate
echo   pip install -r requirements.txt
echo   python init_db.py
echo   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Terminal Window 2 - Frontend Server:
echo   cd %FRONTEND_DIR%
echo   npm install
echo   npm run dev
echo.
echo Then visit: http://localhost:5000
echo.
echo Press any key to open a command prompt for the backend...
pause

start cmd /k "cd /d %BACKEND_DIR% && python -m venv .venv && .venv\Scripts\activate && pip install -r requirements.txt && python init_db.py && echo. && echo Starting backend server... && echo. && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo Now open ANOTHER command prompt and run:
echo   cd %FRONTEND_DIR%
echo   npm install
echo   npm run dev
echo.
pause
exit /b 0

:backend_only
echo [Backend] Starting FastAPI server on port 8000...
cd /d "%BACKEND_DIR%"
if not exist ".venv" (
    echo [Setup] Creating virtual environment...
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
exit /b 0

:frontend_only
echo [Frontend] Starting Vite dev server on port 5000...
cd /d "%FRONTEND_DIR%"
if not exist "node_modules" (
    echo [Setup] Installing dependencies...
    npm install
)
npm run dev
exit /b 0

:init_db
echo [Setup] Initializing database...
cd /d "%BACKEND_DIR%"
if not exist ".venv" (
    python -m venv .venv
)
call .venv\Scripts\activate.bat
pip install -q -r requirements.txt
python init_db.py
pause
exit /b 0

:help
echo Usage: start.bat [OPTIONS]
echo.
echo Options:
echo   --help, -h          Show this help message
echo   --backend-only      Start only the backend server
echo   --frontend-only     Start only the frontend server
echo   --init-db           Initialize the database before starting
echo.
echo Environment:
echo   Backend will run on:    http://localhost:8000
echo   Frontend will run on:   http://localhost:5000
echo   API Docs:               http://localhost:8000/docs
echo.
pause
exit /b 0
