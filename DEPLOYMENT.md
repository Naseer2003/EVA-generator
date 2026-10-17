# Deploying EVA

Three services plus an external PostgreSQL:

```
browser ──▶ frontend :3000 ──▶ backend :3001 ──▶ engine :8000
                                   └──▶ PostgreSQL (Neon or any 14+)
```

Only the frontend and backend need to be reachable from a browser. The engine
is internal — nothing outside the backend calls it.

## Quick start

```bash
cp .env.example .env     # set DATABASE_URL and JWT_SECRET
docker compose up --build
```

- Dashboard: http://localhost:3000
- API: http://localhost:3001/api/v1

First run pulls base images and compiles SciPy wheels into the engine layer;
expect a few minutes. Subsequent builds are cached.

## Required configuration

| Variable | Needed by | Notes |
|---|---|---|
| `DATABASE_URL` | backend | Postgres connection string. Prisma hands this to the pg driver adapter at runtime — the schema's `datasource` block carries no `url`. |
| `DIRECT_URL` | migrations | Non-pooled endpoint for `prisma migrate`. Defaults to `DATABASE_URL`. |
| `JWT_SECRET` | backend | `openssl rand -base64 48`. Rotating it logs every user out. |
| `FRONTEND_URL` | backend | CORS origin. Must match where the browser loads the UI. |
| `NEXT_PUBLIC_API_URL` | frontend **build** | See the warning below. |

### `NEXT_PUBLIC_*` is baked in at build time

These are inlined into the client bundle by `next build`. They are **not** read
when the container starts, so changing one means rebuilding the image:

```bash
docker compose build frontend && docker compose up -d frontend
```

And the value must be the URL **the browser** uses. Inside compose that is
`http://localhost:3001/api/v1` — the published port. `http://backend:3001` only
resolves on the container network, which the browser is not on.

Behind a reverse proxy, build with the public URL:

```bash
docker compose build frontend \
  --build-arg NEXT_PUBLIC_API_URL=https://eva.example.com/api/v1
```

## Database migrations

Compose does not run migrations — applying schema changes to a shared database
on every container start is a good way to lose data. Run them deliberately:

```bash
cd backend
npx prisma migrate deploy          # against DIRECT_URL
```

## Persistence

Uploaded datasets live on a named volume (`eva-uploads` → `/app/uploads`).
Without it, every CSV and its `-meta.json` sidecar disappears when the backend
container is replaced — and because `EvaRun` rows reference those files by
path, previously-completed analyses stop rendering. Back this volume up
alongside the database; neither is useful without the other.

## Why the backend image contains Python

The upload path shells out to `parse_excel.py` (pandas + openpyxl) to read
`.xlsx`/`.xlsm` workbooks, so the backend image installs its own interpreter at
`/opt/pyenv` and points `PYTHON_BIN` at it. Every statistical calculation still
happens in the engine; this is only workbook parsing.

The cleaner shape is to move Excel parsing behind an engine endpoint, which
would let the backend drop back to a plain Node image and remove a duplicated
pandas install. That is a code change, not a packaging one, so it is not done
here.

## Scaling notes

The engine is CPU-bound: a single AD test runs a 5,000-trial Monte Carlo with
an MLE re-fit per trial. `UVICORN_WORKERS` defaults to 1; raise it to match the
CPU allocation, or run replicas behind a load balancer. The backend and
frontend are I/O-bound and scale horizontally without special handling.

The engine holds no state, so it can be replaced freely. The backend holds the
uploads volume, so pin it to one host unless you move uploads to object
storage.

## Hardening before production

Not done here, and worth doing:

- **Terminate TLS** at a reverse proxy and serve both apps from one origin;
  that also removes the CORS dependency.
- **Do not publish the backend port** directly once a proxy is in front.
- **Rate-limit `/auth/login`** — there is no throttling today.
- **Cap engine CPU/memory** in the orchestrator. A large dataset with
  `compute_p_value` enabled can run for minutes.
- **Review the `uploads` volume permissions**; files are written with the
  container user's ownership (uid 10001).

## What has been verified

- `next build` produces `.next/standalone` with `server.js`, and the exact
  runtime layout the frontend Dockerfile assembles boots and serves
  `/login` and `/` with HTTP 200.
- The engine's import surface is only fastapi, numpy, pydantic,
  pydantic-settings, scipy and uvicorn — `requirements-docker.txt` reflects
  that and omits six unused packages from `requirements.txt` (matplotlib,
  plotly, pandas, psycopg2-binary, python-jose, httpx), which is roughly
  400 MB of image.
- Backend `tsc --noEmit` and `nest build` pass; `prisma generate` needs no
  `DATABASE_URL`.
- Both engine CI steps pass locally: `test_engine.py`, and the goodness-of-fit
  sanity checks (a true Gumbel sample passes its own AD test; 10%-banded data
  is flagged inapplicable; the START 2003-5 OSL reference values reproduce).

**Not verified:** the Docker images have not been built. The Docker CLI is
installed on the development machine but the Desktop daemon was stopped, so
`docker build` could not run. The Dockerfiles are written against verified
build outputs and file layouts, but they have not been executed. Build them
once before relying on them:

```bash
docker compose build
```
