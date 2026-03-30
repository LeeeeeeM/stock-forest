FROM node:22-alpine AS frontend-builder

WORKDIR /src/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

FROM golang:1.24-alpine AS backend-builder

WORKDIR /src/backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/server ./cmd/server

FROM alpine:3.20

RUN apk add --no-cache nginx tzdata && adduser -D -H -u 10001 appuser

WORKDIR /app
COPY --from=backend-builder /out/server /app/server
COPY --from=frontend-builder /src/frontend/dist /usr/share/nginx/html
COPY app/nginx.conf /etc/nginx/http.d/default.conf
COPY app/start.sh /app/start.sh
RUN chmod +x /app/start.sh && chown -R appuser:appuser /app /usr/share/nginx/html /var/lib/nginx /var/log/nginx /run/nginx

USER appuser
EXPOSE 80

ENTRYPOINT ["/app/start.sh"]

