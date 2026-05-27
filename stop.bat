@echo off
REM ============================================================
REM  Statlog dev servers - stop both
REM    Kills processes listening on :8000 (backend) and :8080 (frontend).
REM ============================================================
echo Stopping backend/frontend servers...
echo.

set "FOUND="
for %%P in (8000 8080) do (
  for /f "tokens=5" %%I in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
    echo   port %%P : killing PID %%I
    taskkill /F /PID %%I >nul 2>&1
    set "FOUND=1"
  )
)

if not defined FOUND (
  echo   No running servers found ^(ports 8000/8080 not in use^).
)
echo.
echo Done.
