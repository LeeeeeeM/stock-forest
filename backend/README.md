# Backend

## 本地启动

1. 复制环境变量：
   - `cp .env.example .env`
2. 在仓库根目录启动 PostgreSQL：
   - `docker compose -f ../docker-compose.yml up -d`
3. 安装依赖：
   - `go mod tidy`
4. 安装项目本地 air（一次即可）：
   - `./install-air.sh`
5. 启动后端（优先使用本地 `.bin/air` 热更新）：
   - `./start.sh`

说明：
- `start.sh` 优先执行 `./.bin/air`
- 若本地 air 不存在，才尝试全局 `air`，再降级到 `go run`

默认服务地址：`http://localhost:8080`

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`（Bearer Token）

