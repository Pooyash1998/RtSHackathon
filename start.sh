#!/bin/bash
# Startup script for Railway

cd /app/backend

# Use Railway's PORT or default to 8000
PORT=${PORT:-8000}

echo "Starting uvicorn on port $PORT..."

uv run uvicorn src.main:app --host 0.0.0.0 --port $PORT
