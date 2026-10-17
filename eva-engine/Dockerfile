# ─── EVA statistical engine (FastAPI + NumPy/SciPy) ──────────────────────────
#
# Python 3.12 rather than the 3.14 used locally: SciPy and NumPy publish
# manylinux wheels for 3.12, so the image builds without a compiler toolchain.
# The engine code is 3.10+ compatible (PEP 604 unions, no 3.13/3.14 features).

FROM python:3.12-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Dependencies first so edits to app code don't invalidate the wheel install.
COPY requirements-docker.txt ./
RUN pip install --no-cache-dir -r requirements-docker.txt

COPY main.py ./
COPY app ./app

# Run unprivileged. uvicorn binds 8000 (non-reserved), so no capabilities needed.
RUN useradd --create-home --uid 10001 eva \
    && chown -R eva:eva /app
USER eva

EXPOSE 8000

# The engine is CPU-bound (MLE optimisation, 5000-trial Monte Carlo). Workers
# are set from the compose file / orchestrator rather than baked in, so a single
# worker here keeps memory predictable; scale with replicas or UVICORN_WORKERS.
ENV UVICORN_WORKERS=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health/', timeout=4).status==200 else 1)"

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers ${UVICORN_WORKERS}"]
