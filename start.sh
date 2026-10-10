#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

PID_FILE=".backend.pid"
LOG_FILE="backend.log"
PORT="${PORT:-8000}"

start() {
  if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    echo "Backend already running (pid $(cat "$PID_FILE"))"
    exit 0
  fi
  nohup python -m uvicorn api.main:app --host 127.0.0.1 --port "$PORT" --reload \
    >"$LOG_FILE" 2>&1 &
  PID=$!
  echo "$PID" >"$PID_FILE"
  sleep 1.5
  if ! kill -0 "$PID" 2>/dev/null; then
    rm -f "$PID_FILE"
    echo "Backend failed to start:"
    tail -5 "$LOG_FILE"
    exit 1
  fi
  echo "Backend started (pid $PID, port $PORT), logs: $LOG_FILE"
}

stop() {
  if [ ! -f "$PID_FILE" ]; then
    echo "No backend running"
    exit 0
  fi
  PID=$(cat "$PID_FILE")
  kill "$PID" 2>/dev/null || true
  pkill -P "$PID" 2>/dev/null || true
  rm -f "$PID_FILE"
  echo "Backend stopped (pid $PID)"
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  *) echo "usage: $0 [start|stop|restart]"; exit 1 ;;
esac
