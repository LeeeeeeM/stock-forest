# Backend

## 本地启动

1. 复制环境变量：
   - `cp .env.example .env`
2. 在仓库根目录启动 PostgreSQL：
   - `docker compose -f ../docker-compose.yml up -d`
3. 安装依赖：
   - `go mod tidy`
4. 执行数据库迁移：
   - `go run ./cmd/migrate up`
5. 安装项目本地 air（一次即可）：
   - `./install-air.sh`
6. 启动后端（优先使用本地 `.bin/air` 热更新）：
   - `./start.sh`

说明：
- `start.sh` 优先执行 `./.bin/air`
- 若本地 air 不存在，才尝试全局 `air`，再降级到 `go run`

默认服务地址：`http://localhost:8080`

## 数据库迁移（golang-migrate）

- 迁移目录：`backend/migration`
- 命令：
  - `go run ./cmd/migrate up`：执行全部未执行迁移
  - `go run ./cmd/migrate up 1`：只执行 1 条迁移
  - `go run ./cmd/migrate down`：回滚 1 条迁移
  - `go run ./cmd/migrate down 2`：回滚 2 条迁移
  - `go run ./cmd/migrate version`：查看当前版本
  - `go run ./cmd/migrate force <version>`：强制设置版本（故障修复用）

说明：
- `cmd/migrate` 默认从当前目录的 `migration` 读取脚本；可通过 `MIGRATION_DIR` 覆盖。
- 上线建议顺序：先 `migrate up`，再发布应用镜像。

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`（Bearer Token）
- `GET /api/auth/profile`（Bearer Token，含最近 3 次登录历史）
