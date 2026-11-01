# ---- Build stage -------------------------------------------------------------
FROM docker.io/library/node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

# ---- Runtime stage -----------------------------------------------------------
FROM docker.io/library/node:24-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production \
	PORT=3000 \
	HOST=0.0.0.0 \
	DATA_DIR=/app/data \
	UPLOAD_DIR=/app/uploads

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/build ./build

RUN mkdir -p /app/data /app/uploads && chown node:node /app/data /app/uploads
VOLUME ["/app/data", "/app/uploads"]

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
	CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "build"]
