#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

AIR_VERSION="${AIR_VERSION:-latest}"
AIR_PKG="github.com/air-verse/air"
TARGET_BIN="$SCRIPT_DIR/.bin/air"

mkdir -p "$SCRIPT_DIR/.bin"

echo "[backend] building local air: ${AIR_PKG}@${AIR_VERSION}"
GOBIN="$SCRIPT_DIR/.bin" go install "${AIR_PKG}@${AIR_VERSION}"

if [[ -x "$TARGET_BIN" ]]; then
  echo "[backend] local air ready: $TARGET_BIN"
else
  echo "[backend] failed to install local air"
  exit 1
fi
