# Dockerfile for Railway deployment
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install UV
RUN pip install uv

# Copy backend files
COPY backend ./backend

# Change to backend directory
WORKDIR /app/backend

# Install dependencies
RUN uv sync

# Expose port (Railway will override with $PORT)
EXPOSE 8000

# Start command - Railway will inject $PORT
CMD uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}
