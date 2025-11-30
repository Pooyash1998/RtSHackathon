# Dockerfile for Railway deployment
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install UV and bash
RUN pip install uv

# Copy backend files and startup script
COPY backend ./backend
COPY start.sh /app/start.sh

# Make startup script executable
RUN chmod +x /app/start.sh

# Change to backend directory
WORKDIR /app/backend

# Install dependencies
RUN uv sync

# Expose port
EXPOSE 8000

# Use the startup script
CMD ["/app/start.sh"]
