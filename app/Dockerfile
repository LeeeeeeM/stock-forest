FROM --platform=$BUILDPLATFORM node:24.22.2-alpine AS frontend-builder

WORKDIR /src/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine AS backend-builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /out/server ./cmd/server
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /out/migrate ./cmd/migrate

FROM openresty/openresty:1.31.1.1-6-alpine

RUN apk add --no-cache tzdata && adduser -D -H -u 10001 appuser

WORKDIR /app
COPY --from=backend-builder /out/server /app/server
COPY --from=backend-builder /out/migrate /app/migrate
COPY --from=backend-builder /src/backend/migration /app/migration
COPY --from=frontend-builder /src/frontend/dist /usr/local/openresty/nginx/html
COPY app/nginx.conf /etc/nginx/conf.d/default.conf
COPY app/start.sh /app/start.sh
RUN chmod +x /app/start.sh \
    && chown -R appuser:appuser /app /usr/local/openresty/nginx/html \
    && chown -R appuser:appuser /usr/local/openresty/nginx/logs /var/run/openresty

USER appuser
EXPOSE 80
STOPSIGNAL SIGQUIT

ENTRYPOINT ["/app/start.sh"]
