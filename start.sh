#!/bin/bash
# ============================================================
#  Statlog dev servers - start both
#    backend  : uvicorn  http://localhost:8000
#    frontend : vite     http://localhost:5173
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 가상환경 파이썬 선택 — Unix는 .venv/bin, Windows(git-bash)는 .venv/Scripts.
if [ -x "$SCRIPT_DIR/.venv/bin/python" ]; then
  VENV_PY="$SCRIPT_DIR/.venv/bin/python"
elif [ -x "$SCRIPT_DIR/.venv/Scripts/python.exe" ]; then
  VENV_PY="$SCRIPT_DIR/.venv/Scripts/python.exe"
else
  echo "  [warn] .venv를 찾지 못해 시스템 python을 사용합니다."
  VENV_PY="python"
fi

echo "[1/2] Starting backend (uvicorn :8000)..."
nohup "$VENV_PY" -m uvicorn main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
echo "  backend PID: $!"

echo "[2/2] Starting frontend (vite :5173)..."
cd "$SCRIPT_DIR/front"
nohup npm run dev > ../frontend.log 2>&1 &
echo "  frontend PID: $!"

echo ""
echo "Both servers started in background."
echo "  backend  : http://localhost:8000"
echo "  frontend : http://localhost:5173"
echo ""
echo "Run stop.sh to stop them."
