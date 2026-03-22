# syntax=docker/dockerfile:1
#
# Cloud Run Dockerfile (monorepo)
# - Builds only `shared/` + `server/` (Express API)
# - Intended to be built from repo root
#
# Cloud Run sets PORT at runtime; the server reads it via env config.

FROM node:20-slim AS deps
WORKDIR /app

# Puppeteer is currently an unused dependency in this repo; skipping the Chromium
# download keeps builds small and avoids Cloud Build timeouts.
#
# Also explicitly keep devDependencies enabled during the build so TypeScript
# can see `@types/node` even if the build environment defaults to production mode.
ENV PUPPETEER_SKIP_DOWNLOAD=1 \
    NODE_ENV=development \
    NPM_CONFIG_PRODUCTION=false

# Install workspace deps (needs root + workspace package manifests)
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json

# Install dev deps for TypeScript build.
RUN npm ci --include=dev --no-audit --no-fund

FROM node:20-slim AS build
WORKDIR /app
ENV PUPPETEER_SKIP_DOWNLOAD=1

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY --from=deps /app/server/package.json ./server/package.json
COPY --from=deps /app/shared/package.json ./shared/package.json

COPY shared ./shared
COPY server ./server

RUN npm run build -w shared && npm run build -w server

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Install production dependencies for workspaces.
# Note: do NOT run `npm prune` at the workspace root; it can remove server deps
# because the root package has no production dependencies.
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY shared/package.json ./shared/package.json
RUN npm ci --omit=dev --no-audit --no-fund

# Copy compiled output (no TS needed at runtime).
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/server/dist ./server/dist

# Cloud Run listens on $PORT (usually 8080). EXPOSE is informational.
EXPOSE 8080

CMD ["node", "server/dist/index.js"]

