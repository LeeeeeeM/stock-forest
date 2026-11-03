FROM --platform=$BUILDPLATFORM node:24.22.2-alpine AS builder

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM openresty/openresty:1.31.1.1-6-alpine

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/local/openresty/nginx/html

EXPOSE 80
STOPSIGNAL SIGQUIT

