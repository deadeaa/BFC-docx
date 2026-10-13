# backend/Dockerfile
FROM golang:1.22-alpine AS go-builder

WORKDIR /app

# Copy seluruh source code termasuk folder vendor
COPY . .

# Build Go secara offline dari folder vendor
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -mod=vendor -ldflags="-s -w" -o bfc-backend main.go

# FINAL STAGE: Langsung gunakan node:18-alpine (Node.js sudah ada bawaan, tidak perlu apk add!)
FROM node:18-alpine

WORKDIR /root/

# Copy binary Go hasil build
COPY --from=go-builder /app/bfc-backend .

# Copy source code backend & node_modules
COPY index.js .
COPY node_modules ./node_modules

RUN mkdir -p uploads/templates

EXPOSE 8080
EXPOSE 3001

ENV GIN_MODE=release

CMD ["sh", "-c", "node index.js & ./bfc-backend"]