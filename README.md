# stock-forest

## 本地或服务器运行

本仓库**不再提供** `docker-compose.yml`。数据库与应用请自行用 `docker run` / 编排工具部署。

应用镜像（Docker Hub）：**`slm1990/goodwood`**，标签示例 **`amd-v0.0.2`**（amd64）。  
容器内需配置 `APP_PORT`、`DB_*`、`JWT_*` 等环境变量（可参考仓库根目录 `.env.example`）。

PostgreSQL 可单独起容器，例如：

```bash
docker run -d --name some-postgres -e POSTGRES_PASSWORD=yourpass -p 5432:5432 postgres:16
```

数据库迁移（镜像内）：`/app/migrate up`。

后端本地开发（不设 compose）：见 **`backend/README.md`**。

## 构建并推送应用镜像（Docker Hub）

Docker Hub 仓库名：**`slm1990/goodwood`**（线上部署用名；Git 仓库名仍为 stock-forest）。

```bash
docker login -u slm1990
./deploy/scripts/publish.sh
```

若推送失败，多为未登录 Docker Hub 或无权推送该仓库名；需换仓库名时：`IMAGE=其它用户名/其它仓库 ./deploy/scripts/publish.sh`。  
代理请配置在 **Docker Desktop**（与本机 shell 的 `export http_proxy` 无关）；脚本默认使用 `desktop-linux` 构建器以走 `daemon.json` 中的代理。

切换标签：`TAG=v0.0.7 ./deploy/scripts/publish.sh`。  
仅构建 arm64（例如双架构拉 Docker Hub 超时）：`PLATFORM=linux/arm64 ./deploy/scripts/publish.sh`。

仅本地构建 amd64（不入库，标签默认 **`amd-v0.0.2`**）：

```bash
./deploy/scripts/build-amd.sh
```

构建并推送到 Docker Hub（amd64 + 标签 **`amd-v0.0.2`**）：

```bash
./deploy/scripts/publish-amd.sh
```

等价于：`PLATFORM=linux/amd64 TAG=amd-v0.0.2 ./deploy/scripts/publish.sh`。  
换小版本：`TAG=amd-v0.0.3 ./deploy/scripts/publish-amd.sh`。

服务器上更新镜像后，自行重启对应容器（例如 `docker pull slm1990/goodwood:amd-v0.0.2` 后替换运行中的应用容器）。
