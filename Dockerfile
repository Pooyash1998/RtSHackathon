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

# Expose port
EXPOSE 8000

# Start command - Use shell form to properly expand $PORT
CMD ["sh", "-c", "uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
