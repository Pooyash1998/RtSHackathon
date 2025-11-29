# EduComic Development Guide

## Quick Start - Running Frontend and Backend

### Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed
- uv package manager installed (recommended for team collaboration)

### Setup with UV (Recommended)

#### Install UV
```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with pip
pip install uv
```

#### Install Backend Dependencies
```bash
cd backend
uv sync
```

#### Install Frontend Dependencies
```bash
cd frontend
npm install
```

### Starting the Servers

#### Quick Start (Recommended)
```bash
./start-dev.sh
```

This will start both backend and frontend servers automatically.

#### Manual Start (Alternative)

**Terminal 1 - Backend (FastAPI)**
```bash
cd backend/src
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend (React + Vite)**
```bash
cd frontend
npm run dev
```

#### Stopping Servers
```bash
# If using start-dev.sh: Press Ctrl+C
# Or run:
./stop-dev.sh
```

The backend will be available at: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

The frontend will be available at: http://localhost:8080

### Testing the Connection

1. Open http://localhost:8080 in your browser
2. Navigate to a classroom
3. Click "Generate Story"
4. Enter a lesson prompt and click "Generate Story Options"
5. The frontend will call the backend API to generate story options using OpenAI

### API Endpoints

#### Health Check
```bash
curl http://localhost:8000/health
```

#### Generate Story Options
```bash
curl -X POST "http://localhost:8000/story/generate-options?classroom_id=942f3ae3-1dbd-4b7c-afd3-135b3e386de1&lesson_prompt=Newton%27s%20Laws%20of%20Motion"
```

#### Create Avatar
```bash
curl -X POST "http://localhost:8000/avatar/create/{student_id}"
```

### Environment Variables

#### Backend (.env in backend/)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
BLACK_FOREST_API_KEY=your_flux_key
ENVIRONMENT=development
```

#### Frontend (.env in frontend/)
```env
VITE_API_URL=http://localhost:8000
```

### Troubleshooting

#### Backend won't start
- Make sure dependencies are installed: `cd backend && uv sync`
- Check if port 8000 is in use: `lsof -i :8000`
- Verify environment variables are set in `backend/.env`
- Try running with: `uv run uvicorn main:app --reload --port 8000`

#### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check browser console for CORS errors
- Verify `VITE_API_URL` in `frontend/.env`

#### Story generation fails
- Check OpenAI API key is valid in `backend/.env`
- Check backend logs for error messages
- Verify classroom exists in database

### Development Workflow

1. Make changes to backend code → FastAPI auto-reloads
2. Make changes to frontend code → Vite auto-reloads
3. Test in browser at http://localhost:8080
4. Check API responses at http://localhost:8000/docs

### Testing Story Generation

To test the story generation feature:

1. Start both servers
2. Navigate to: http://localhost:8080/teacher/classroom/{classroom_id}/story/generate
3. Enter a lesson prompt (e.g., "Newton's Laws of Motion")
4. Click "Generate Story Options"
5. The app will call the backend API which uses OpenAI to generate 3 story options
6. Select a story option to continue

### Database

The app uses Supabase for data storage. Make sure your Supabase credentials are configured in `backend/.env`.

To view/edit data:
- Go to your Supabase dashboard
- Navigate to Table Editor
- View classrooms, students, chapters, and panels tables
