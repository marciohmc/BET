# --- Base Stage (Node environment setup) ---
FROM node:20-alpine AS base
WORKDIR /app

# --- Build Dependencies Stage ---
FROM base AS dependencies
COPY package*.json ./
RUN npm ci

# --- Builder Stage (Compiles TypeScript to JavaScript) ---
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Production Runner Stage (Lean, secured container for release) ---
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy package configurations and production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled code from the builder stage
COPY --from=builder /app/dist ./dist

# Security Hardening: Run as non-root node user (Security Best Practice)
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
