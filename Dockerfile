# Multi-stage Dockerfile for ReachCraft Outreach Platform

# 1. Builder Stage
FROM node:22-slim AS builder
WORKDIR /app

# Copy root and workspace definitions
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies including linux-specific rollup binary
RUN npm install
RUN npm install -D @rollup/rollup-linux-x64-gnu --workspace=client

# Copy full source
COPY . .

# Build client and server
RUN npm run build

# 2. Production Runner Stage
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
ENV DATABASE_PATH=/app/data/outreach.db

# Copy package definitions and install production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server/package*.json ./server/
COPY --from=builder /app/client/package*.json ./client/
RUN npm install --omit=dev --workspace=server

# Copy built server and client artifacts
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

# Create storage directories
RUN mkdir -p /app/data /app/uploads

EXPOSE 5000

CMD ["node", "server/dist/index.js"]
