#!/usr/bin/env sh
set -eu

/app/server &
exec nginx -g "daemon off;"

