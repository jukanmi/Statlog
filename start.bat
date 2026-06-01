@echo off
REM ============================================================
REM  Statlog dev servers - start both
REM    backend  : uvicorn  http://localhost:8000
REM    frontend : vite     http://localhost:5173
REM  Each runs in its own console window. Use stop.bat to stop.
REM ============================================================
cd /d "%~dp0"

echo [1/2] Starting backend (uvicorn :8000)...
start "Statlog Backend" cmd /k "call .venv\Scripts\activate.bat && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [2/2] Starting frontend (vite :5173)...
start "Statlog Frontend" cmd /k "cd /d "%~dp0front" && npm run dev"

echo.
echo Both servers started in separate windows.
echo   backend  : http://localhost:8000
echo   frontend : http://localhost:5173
echo.
echo Run stop.bat to stop them.
