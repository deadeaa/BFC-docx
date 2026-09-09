# backend/Dockerfile
FROM golang:1.22-alpine AS go-builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o bfc-backend main.go

FROM node:18-alpine AS node-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

FROM alpine:latest

RUN apk --no-cache add ca-certificates nodejs npm

WORKDIR /root/

COPY --from=go-builder /app/bfc-backend .

COPY --from=node-builder /app/node_modules ./node_modules
COPY index.js .

RUN mkdir -p uploads/templates

EXPOSE 8080
EXPOSE 3001

ENV GIN_MODE=release

CMD ["sh", "-c", "node index.js & ./bfc-backend"]