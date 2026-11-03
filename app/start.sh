#!/bin/sh
set -eu

/app/server &
SERVER_PID=$!

openresty -g 'daemon off;' &
OPENRESTY_PID=$!

term_handler() {
  kill "$SERVER_PID" "$OPENRESTY_PID" 2>/dev/null || true
}

trap term_handler TERM INT QUIT

while kill -0 "$SERVER_PID" 2>/dev/null && kill -0 "$OPENRESTY_PID" 2>/dev/null; do
  sleep 1
done

term_handler
wait "$SERVER_PID" 2>/dev/null || true
wait "$OPENRESTY_PID" 2>/dev/null || true
