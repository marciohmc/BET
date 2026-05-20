# --- Base Stage (Node environment setup) ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

# --- Development Stage (for local hot-reloaded development) ---
FROM base AS development
COPY package*.json ./
RUN npm install
# Copy rest of the backend files
COPY . .
EXPOSE 5000
CMD ["npm", "run", "dev"]

# --- Builder Stage (compiles TypeScript to JavaScript) ---
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build \
    && npm prune --production

# --- Production Runner Stage (lean, secured container for release) ---
FROM node:20-alpine AS production
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy compiled code and production-only dependencies
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

# Security Hardening: Run as non-root node user (AppSec Best Practice)
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]
