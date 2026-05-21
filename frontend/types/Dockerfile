# --- Base Stage (Node environment setup) ---
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

# --- Dependencies Installation State ---
FROM base AS deps
COPY package*.json ./
RUN npm ci

# --- Builder Stage (Next.js compilation) ---
FROM base AS builder
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY . .

# Next.js build-time variables (Telemetry disabled for privacy and speed)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=http://localhost:5000/api

RUN npm run build

# --- Runner Stage (Stable, isolated client runtime environment) ---
FROM node:20-alpine AS runner
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package info, runtime node modules, and Next.js built artifacts
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/public ./public

EXPOSE 3000

# Security Hardening: Run as non-privileged standard node user
USER node

CMD ["npm", "run", "start"]
