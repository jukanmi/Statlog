#!/bin/bash
# ============================================================
#  Statlog dev servers - stop both
# ============================================================

echo "Stopping backend/frontend servers..."

FOUND=0
for PORT in 8000 8080; do
  PID=$(lsof -ti :$PORT)
  if [ -n "$PID" ]; then
    echo "  port $PORT : killing PID $PID"
    kill -9 $PID
    FOUND=1
  fi
done

if [ $FOUND -eq 0 ]; then
  echo "  No running servers found (ports 8000/8080 not in use)."
fi

echo "Done."