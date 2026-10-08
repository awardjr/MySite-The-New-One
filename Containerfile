# ------------------------------------------------------------------------------
# Stage 1: Build Stage
# ------------------------------------------------------------------------------
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Install native compilation dependencies for better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy application source code
COPY . .

# Run type check, unit tests, and compile SvelteKit production bundle
RUN npm run check
RUN npm run build
RUN npm prune --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Runtime Stage
# ------------------------------------------------------------------------------
FROM node:24-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production \
    PORT=6941 \
    HOST=0.0.0.0 \
    ORIGIN=http://localhost:6941 \
    PROTOCOL_HEADER=x-forwarded-proto \
    HOST_HEADER=x-forwarded-host \
    BODY_SIZE_LIMIT=52428800

# Set up unprivileged user and storage directories
RUN mkdir -p /app/data /app/static/uploads && \
    chown -R node:node /app

# Copy production runtime artifacts
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/build ./build
COPY --from=builder --chown=node:node /app/static ./static

USER node

EXPOSE 6941

VOLUME ["/app/data", "/app/static/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:6941/').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

CMD ["node", "build"]
