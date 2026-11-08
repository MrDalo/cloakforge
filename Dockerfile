# syntax=docker/dockerfile:1
#
# Self-hosted CloakForge image. Production runs on Vercel; this image is for self-hosting / local checks.
#
# Build (BuildKit). Build-time values, including the NEXT_PUBLIC_* ones inlined into the browser bundle,
# come from an env file mounted as a secret, so they never land in an image layer:
#   docker build --secret id=build_env,src=.env.production.local -t cloakforge .
# Run (runtime secrets via --env-file; the server refuses to boot when required vars are missing):
#   docker run --rm -p 3000:3000 --env-file .env.production.local cloakforge

# ── 1. Dependencies (dev included: the build needs them) ───────────────────────────────────────────
# node 24.22.0 on Alpine 3.24, pinned by multi-arch digest (Dependabot keeps all three stages in sync).
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps --no-audit --no-fund

# ── 2. Build (standalone output is enabled by DOCKER_BUILD=1, see next.config.ts) ─────────────────
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS builder
WORKDIR /app
ENV DOCKER_BUILD=1 \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=secret,id=build_env,target=/app/.env.production.local \
    npm run build

# ── 3. Runtime (standalone server only, no devDependencies, non-root) ───────────────────────────────
FROM node:24-alpine@sha256:44fce696f38ba8c987c4db89954051000bbd05ffd8d8659ba15ed4a8602e937f AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000

# robots.txt is a static route: cheap, no RPC or CMS calls.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/robots.txt').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

# Logs go to stdout/stderr (docker logs / log drivers); no shell wrapper, so signals reach node.
CMD ["node", "server.js"]
