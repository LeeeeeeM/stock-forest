#!/usr/bin/env bash
# 仅本地构建 linux/amd64 并 docker load（不 push）。
# 若构建阶段拉 Docker Hub metadata 超时，可先执行下方三条 pull（与本脚本内置一致）。
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
IMAGE="${IMAGE:-slm1990/goodwood}"
TAG="${TAG:-amd-v0.0.2}"
BUILDER="${BUILDER:-desktop-linux}"

echo "Pre-pull amd64 base images (warm cache, reduce auth.docker.io timeout)..."
docker pull --platform linux/amd64 node:24-alpine
docker pull --platform linux/amd64 golang:1.24-alpine
docker pull --platform linux/amd64 openresty/openresty:alpine

cd "$ROOT_DIR"
docker buildx build \
  --builder "${BUILDER}" \
  --platform linux/amd64 \
  -t "${IMAGE}:${TAG}" \
  -f Dockerfile \
  --load \
  .

echo "Local image: ${IMAGE}:${TAG}"
docker images "${IMAGE}" --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}'
