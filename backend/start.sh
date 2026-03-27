#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOCAL_AIR_BIN="$SCRIPT_DIR/.bin/air"

if [[ -f ".env" ]]; then
  echo "[backend] using .env"
else
  echo "[backend] .env not found, fallback to defaults/.env.example"
fi

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

