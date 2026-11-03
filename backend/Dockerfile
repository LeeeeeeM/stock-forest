FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine AS builder

ARG TARGETOS
ARG TARGETARCH

WORKDIR /src

COPY backend/go.mod backend/go.sum ./backend/
WORKDIR /src/backend
RUN go mod download

COPY backend/ ./
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build -o /out/server ./cmd/server

FROM alpine:3.20

RUN adduser -D -H -u 10001 appuser
USER appuser
WORKDIR /app

COPY --from=builder /out/server /app/server

EXPOSE 8080

ENTRYPOINT ["/app/server"]

