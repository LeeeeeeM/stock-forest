# stock-forest

## Docker 一键启动（双镜像）

在 `new-apps` 目录执行：

```bash
docker compose up -d --build
```

启动后：

- 应用入口（前端 + 后端 API 代理）：`http://localhost:5173`
- 后端 API（容器内）：`http://127.0.0.1:8080`（由应用容器内 Nginx 代理）
- PostgreSQL：`localhost:5432`

停止服务：

```bash
docker compose down
```

若需要清空数据库（包含 volume）：

```bash
docker compose down -v
```
