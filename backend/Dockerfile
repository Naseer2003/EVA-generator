# ─── EVA API gateway (NestJS + Prisma) ───────────────────────────────────────
#
# This image also carries a Python interpreter. The upload path shells out to
# parse_excel.py (pandas + openpyxl) to read .xlsx/.xlsm workbooks, so the
# backend needs those two libraries even though every statistical calculation
# happens in the separate engine service. The interpreter is selected at
# runtime via PYTHON_BIN; see DatasetsService.pythonBin().
#
# Moving Excel parsing behind an engine endpoint would let this drop back to a
# plain Node image — noted in DEPLOYMENT.md as the cleaner long-term shape.

# ── build ────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build

WORKDIR /app

# openssl is required by Prisma's query engine during `prisma generate`.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
# The datasource block carries no url (it is supplied at runtime by the Neon /
# pg driver adapter), so generate needs no DATABASE_URL at build time.
RUN npx prisma generate

COPY tsconfig*.json nest-cli.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies from the tree we copy forward.
RUN npm prune --omit=dev


# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:22-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001 \
    PYTHON_BIN=/opt/pyenv/bin/python

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         openssl ca-certificates python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Isolated virtualenv rather than system site-packages: Debian marks the system
# Python externally-managed, and this keeps the Excel parser's dependencies
# from colliding with anything the base image ships.
RUN python3 -m venv /opt/pyenv \
    && /opt/pyenv/bin/pip install --no-cache-dir --upgrade pip \
    && /opt/pyenv/bin/pip install --no-cache-dir pandas openpyxl

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
COPY parse_excel.py ./

# Uploaded datasets land here. Mount a volume at this path — without one,
# uploads and their -meta.json sidecars vanish when the container is replaced.
RUN mkdir -p /app/uploads

RUN useradd --create-home --uid 10001 eva \
    && chown -R eva:eva /app
USER eva

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/datasets').then(r=>process.exit(r.status===401?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/main"]
