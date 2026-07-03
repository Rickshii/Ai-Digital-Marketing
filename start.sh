#!/bin/bash

# MarketerAI - Local Development Startup Script
# Starts both frontend and backend servers in tmux windows or separately

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         MarketerAI - Local Development Startup                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running with --help
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    echo "Usage: ./start.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h          Show this help message"
    echo "  --backend-only      Start only the backend server"
    echo "  --frontend-only     Start only the frontend server"
    echo "  --init-db           Initialize the database before starting"
    echo ""
    echo "Environment:"
    echo "  Backend will run on:    http://localhost:8000"
    echo "  Frontend will run on:   http://localhost:5000"
    echo "  API Docs:               http://localhost:8000/docs"
    echo ""
    exit 0
fi

# Parse options
INIT_DB=false
BACKEND_ONLY=false
FRONTEND_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --init-db)
            INIT_DB=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

# Check if database needs initialization
check_db_init() {
    if [ ! -f "$BACKEND_DIR/ai_marketing.db" ] || [ $INIT_DB = true ]; then
        echo -e "${YELLOW}[Setup] Initializing database...${NC}"
        cd "$BACKEND_DIR"
        if [ -d ".venv" ]; then
            source .venv/bin/activate
        fi
        python init_db.py
        echo -e "${GREEN}[Setup] Database initialized ✓${NC}"
        echo ""
    fi
}

# Start backend
start_backend() {
    echo -e "${YELLOW}[Backend] Starting FastAPI server...${NC}"
    cd "$BACKEND_DIR"
    
    # Check if venv exists
    if [ ! -d ".venv" ]; then
        echo -e "${YELLOW}[Backend] Creating virtual environment...${NC}"
        uv venv
    fi
    
    source .venv/bin/activate
    
    # Install requirements if needed
    if [ -f "requirements.txt" ]; then
        pip install -q -r requirements.txt 2>/dev/null || true
    fi
    
    echo -e "${GREEN}[Backend] ✓ Starting on http://localhost:8000${NC}"
    echo -e "${YELLOW}[Backend] Press Ctrl+C to stop${NC}"
    echo ""
    
    # Initialize DB if needed
    check_db_init
    
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

# Start frontend
start_frontend() {
    echo -e "${YELLOW}[Frontend] Starting Vite dev server...${NC}"
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}[Frontend] Installing dependencies...${NC}"
        npm install --silent || pnpm install --silent || true
    fi
    
    echo -e "${GREEN}[Frontend] ✓ Starting on http://localhost:5000${NC}"
    echo -e "${YELLOW}[Frontend] Press Ctrl+C to stop${NC}"
    echo ""
    
    npm run dev || pnpm dev
}

# Main execution
if [ "$BACKEND_ONLY" = true ]; then
    start_backend
elif [ "$FRONTEND_ONLY" = true ]; then
    start_frontend
else
    # Start both servers
    echo -e "${YELLOW}[Setup] Checking prerequisites...${NC}"
    
    # Initialize DB first if needed
    check_db_init
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                  Starting Both Servers                         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}[Info] To run servers separately, open two terminals:${NC}"
    echo -e "  Terminal 1: ${GREEN}./start.sh --backend-only${NC}"
    echo -e "  Terminal 2: ${GREEN}./start.sh --frontend-only${NC}"
    echo ""
    echo -e "${YELLOW}[Info] Waiting 3 seconds before starting...${NC}"
    sleep 3
    
    # Try to use tmux if available
    if command -v tmux &> /dev/null; then
        echo -e "${GREEN}[Setup] Using tmux to run both servers${NC}"
        
        # Create new session
        tmux new-session -d -s marketerai -x 200 -y 50
        
        # Backend window
        tmux new-window -t marketerai -n backend "cd $BACKEND_DIR && source .venv/bin/activate && python init_db.py && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        
        # Frontend window  
        tmux new-window -t marketerai -n frontend "cd $FRONTEND_DIR && npm run dev"
        
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║              Both Servers Started in tmux!                     ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Servers running:"
        echo -e "  ${GREEN}Backend${NC}  → http://localhost:8000 (API docs: /docs)"
        echo -e "  ${GREEN}Frontend${NC} → http://localhost:5000"
        echo ""
        echo "Tmux commands:"
        echo "  ${YELLOW}tmux attach-session -t marketerai${NC}  → Attach to session"
        echo "  ${YELLOW}Ctrl+B + n${NC} → Next window"
        echo "  ${YELLOW}Ctrl+B + p${NC} → Previous window"
        echo "  ${YELLOW}Ctrl+B + d${NC} → Detach from session"
        echo ""
        echo "To stop all servers:"
        echo "  ${YELLOW}tmux kill-session -t marketerai${NC}"
        echo ""
        
        # Attach to the session
        tmux attach-session -t marketerai
    else
        echo -e "${YELLOW}[Setup] tmux not found, starting servers sequentially${NC}"
        echo -e "${YELLOW}[Info] You need to run these in separate terminals:${NC}"
        echo ""
        echo -e "  ${GREEN}Terminal 1:${NC}"
        echo -e "    cd $BACKEND_DIR"
        echo -e "    source .venv/bin/activate"
        echo -e "    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
        echo ""
        echo -e "  ${GREEN}Terminal 2:${NC}"
        echo -e "    cd $FRONTEND_DIR"
        echo -e "    npm run dev"
        echo ""
        echo -e "${YELLOW}[Fallback] Starting backend now...${NC}"
        echo -e "${YELLOW}[Info] Open another terminal and run the frontend command above${NC}"
        echo ""
        start_backend
    fi
fi
