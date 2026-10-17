# ─── EVA dashboard (Next.js 16 App Router) ───────────────────────────────────
#
# IMPORTANT — NEXT_PUBLIC_* variables are inlined into the client bundle during
# `next build`, not read at container start. NEXT_PUBLIC_API_URL must therefore
# be supplied as a build argument, and it must be the URL the *browser* will
# use. Inside compose that is http://localhost:3001/api/v1 (the published
# port), never http://backend:3001 — the service name only resolves on the
# container network, which the browser is not on. Changing it means rebuilding
# the image, not restarting it.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
ARG NEXT_PUBLIC_EVA_ENGINE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_EVA_ENGINE_URL=$NEXT_PUBLIC_EVA_ENGINE_URL \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

RUN useradd --create-home --uid 10001 nextjs

# server.js plus the traced subset of node_modules.
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
# standalone deliberately omits these two; copy them in or static assets 404.
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
