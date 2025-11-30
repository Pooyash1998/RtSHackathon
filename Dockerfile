# Dockerfile for Railway deployment
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install UV
RUN pip install uv

# Copy backend files
COPY backend/pyproject.toml backend/uv.lock ./backend/
COPY backend/src ./backend/src

# Install dependencies
WORKDIR /app/backend
RUN uv sync

# Expose port
EXPOSE 8000

# Start command
CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
