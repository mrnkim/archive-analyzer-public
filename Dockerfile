# syntax=docker/dockerfile:1.7

# ───────────────────────────────────────────────
# Stage 1: build the frontend (Node)
# ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /build

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ───────────────────────────────────────────────
# Stage 2: backend + static files (Python)
# ───────────────────────────────────────────────
FROM python:3.11-slim AS runtime
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System deps (curl is used for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install backend deps first so Docker layer caching kicks in
COPY backend/pyproject.toml ./backend/
WORKDIR /app/backend
RUN pip install -e .

# Backend source + seed data (mock fallback) + video title map
WORKDIR /app
COPY backend/ ./backend/
COPY data/seeds/ ./data/seeds/
COPY data/primed/ ./data/primed/
COPY data/video_titles.json ./data/video_titles.json

# Frontend build output → frontend/dist
COPY --from=frontend-builder /build/dist ./frontend/dist

ENV PYTHONPATH=/app/backend

EXPOSE 8000

# Railway injects $PORT (defaults to 8000 elsewhere)
CMD ["sh", "-c", "cd /app/backend && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
