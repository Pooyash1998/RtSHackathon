# EduComic Setup Guide

This project uses **UV** for Python dependency management to ensure consistent environments across the team.

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **UV** (Python package manager)

## 1. Install UV

### macOS/Linux
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows
```bash
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Alternative (with pip)
```bash
pip install uv
```

Verify installation:
```bash
uv --version
```

## 2. Backend Setup

### Install Dependencies
```bash
cd backend
uv sync
```

This will:
- Create a virtual environment in `.venv/`
- Install all dependencies from `pyproject.toml`
- Lock versions in `uv.lock`

### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `backend/.env` and add your API keys:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
BLACK_FOREST_API_KEY=your_flux_key
ENVIRONMENT=development
```

## 3. Start Development Servers

### Quick Start (Recommended)
From the project root:
```bash
./start-dev.sh
```

This single command will:
1. Install backend dependencies (if needed)
2. Install frontend dependencies (if needed)
3. Start backend on port 8000
4. Start frontend on port 8080
5. Show you when everything is ready

Servers will be available at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Stop Servers
```bash
# Press Ctrl+C in the terminal running start-dev.sh
# Or run:
./stop-dev.sh
```

### Manual Start (Alternative)

If you prefer to run servers separately:

**Backend:**
```bash
cd backend/src
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install  # if not already installed
npm run dev
```

## 4. Database Setup

Follow the instructions in `SUPABASE_SETUP.md` to set up your Supabase database.

## 5. Verify Setup

### Test Backend
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "supabase_configured": true
}
```

### Test Frontend
Open http://localhost:8080 in your browser

### Test API Integration
Open `test-api.html` in your browser to test API endpoints

## Development Workflow

### Adding Python Dependencies
```bash
cd backend
uv add package-name
```

This will:
- Add the package to `pyproject.toml`
- Update `uv.lock`
- Install the package

### Adding Dev Dependencies
```bash
cd backend
uv add --dev package-name
```

### Running Tests
```bash
cd backend
uv run pytest
```

### Running Scripts
```bash
cd backend
uv run python script.py
```

### Adding Frontend Dependencies
```bash
cd frontend
npm install package-name
```

## Team Collaboration

### When pulling changes:

**Backend:**
```bash
cd backend
uv sync
```

**Frontend:**
```bash
cd frontend
npm install
```

### When adding dependencies:

**Backend:**
```bash
cd backend
uv add package-name
git add pyproject.toml uv.lock
git commit -m "Add package-name"
```

**Frontend:**
```bash
cd frontend
npm install package-name
git add package.json package-lock.json
git commit -m "Add package-name"
```

## Troubleshooting

### UV not found
Make sure UV is in your PATH. Restart your terminal after installation.

### Backend won't start
```bash
cd backend
uv sync  # Reinstall dependencies
cd src
uv run uvicorn main:app --reload --port 8000
```

### Port already in use
```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :8080  # Frontend

# Kill the process
kill -9 <PID>
```

### Dependencies out of sync
```bash
cd backend
rm -rf .venv
uv sync
```

### Frontend build errors
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Using Your Own Environment

If you prefer to use your own Python environment (conda, venv, etc.) instead of UV's managed environment:

### Option 1: Use UV to run commands
```bash
uv run uvicorn main:app --reload
```

### Option 2: Install dependencies manually
```bash
# Activate your environment first
conda activate your-env  # or source venv/bin/activate

# Install from pyproject.toml
cd backend
pip install -e .
```

Note: Using UV is recommended for team consistency, but you can use your own environment for development.

## Quick Start Script

For convenience, use the provided script:
```bash
./start-dev.sh
```

This will start both backend and frontend servers.

## Additional Resources

- [UV Documentation](https://docs.astral.sh/uv/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
