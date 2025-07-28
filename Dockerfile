# Install dependencies only when needed
FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* ./
COPY prisma ./prisma

RUN apt-get update && apt-get install -y \
    build-essential \
    libc6-dev \
    curl \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm install -g pnpm && pnpm install; \
  else yarn install; \
  fi

# Rebuild the source code only when needed
FROM node:20-slim AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Accept build-time environment variables
ARG DATABASE_URL
ARG DIRECT_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG JWT_SECRET
ARG PAYMONGO_PUBLIC_KEY
ARG PAYMONGO_SECRET_KEY
ARG NEXT_PUBLIC_BASE_URL
ARG NODE_ENV

# Set them as environment variables for the build
ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV JWT_SECRET=$JWT_SECRET
ENV PAYMONGO_PUBLIC_KEY=$PAYMONGO_PUBLIC_KEY
ENV PAYMONGO_SECRET_KEY=$PAYMONGO_SECRET_KEY
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL
ENV NODE_ENV=$NODE_ENV

RUN npm run build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Only copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set the Next.js port
ENV PORT 8080
EXPOSE 8080

CMD ["node_modules/.bin/next", "start", "-p", "8080"]
