#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOCAL_AIR_BIN="$SCRIPT_DIR/.bin/air"
APP_PORT="${PORT:-8080}"

cleanup_port_listener() {
  if ! command -v lsof >/dev/null 2>&1; then
    return
  fi

  local pids
  pids="$(lsof -tiTCP:"$APP_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return
  fi

  echo "[backend] found listener(s) on :$APP_PORT, stopping: $pids"
  # Give old server a chance to shutdown gracefully first.
  kill -15 $pids 2>/dev/null || true
  sleep 1

  local remain
  remain="$(lsof -tiTCP:"$APP_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "$remain" ]]; then
    echo "[backend] force stop listener(s) on :$APP_PORT: $remain"
    kill -9 $remain 2>/dev/null || true
  fi
}

if [[ -f ".env" ]]; then
  echo "[backend] using .env"
else
  echo "[backend] .env not found, fallback to defaults/.env.example"
fi

cleanup_port_listener

if [[ -x "$LOCAL_AIR_BIN" ]]; then
  echo "[backend] starting with local air ($LOCAL_AIR_BIN)..."
  exec "$LOCAL_AIR_BIN"
elif command -v air >/dev/null 2>&1; then
  echo "[backend] starting with air..."
  exec air
else
  echo "[backend] air not found, starting with go run..."
  echo "[backend] tip: run ./install-air.sh to install project-local air"
  exec go run ./cmd/server
fi

