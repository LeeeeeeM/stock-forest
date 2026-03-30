# stock-forest

## Docker 一键启动（双镜像）

在 `new-apps` 目录执行：

```bash
cp .env.example .env
# 编辑 .env，填入你自己的密钥（尤其是 JWT_* / DB_PASSWORD / RESEND_API_KEY）
docker compose up -d --build
```

启动后：

- 应用入口（前端 + 后端 API 代理）：`http://localhost:5173`
- 后端 API（容器内）：`http://127.0.0.1:8080`（由应用容器内 Nginx 代理）
- PostgreSQL：`localhost:5432`
- 数据库迁移（可选，镜像已内置迁移工具）：
  - `docker compose exec app /app/migrate up`

停止服务：

```bash
docker compose down
```

若需要清空数据库（包含 volume）：

```bash
docker compose down -v
```
