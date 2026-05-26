#!/bin/bash
# ============================================================
#  Statlog dev servers - start both
#    backend  : uvicorn  http://localhost:8000
#    frontend : vite     http://localhost:8080
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/2] Starting backend (uvicorn :8000)..."
nohup python -m uvicorn main:app --host 127.0.0.1 --port 8000 > backend.log 2>&1 &
echo "  backend PID: $!"

echo "[2/2] Starting frontend (vite :8080)..."
cd "$SCRIPT_DIR/front"
nohup npm run dev > ../frontend.log 2>&1 &
echo "  frontend PID: $!"

echo ""
echo "Both servers started in background."
echo "  backend  : http://localhost:8000"
echo "  frontend : http://localhost:8080"
echo ""
echo "Run stop.sh to stop them."