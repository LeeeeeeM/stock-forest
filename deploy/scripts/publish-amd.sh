#!/usr/bin/env bash
# 仅构建 linux/amd64，用于 x86 服务器（如 slm-server）。
# 默认标签：amd-v0.0.2，可覆盖：TAG=amd-v0.0.3 ./deploy/scripts/publish-amd.sh

set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PLATFORM=linux/amd64
export TAG="${TAG:-amd-v0.0.2}"
exec "$ROOT/deploy/scripts/publish.sh"
