# EduComic Backend API

FastAPI backend for the EduComic application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create `.env` file with your Supabase credentials:
```bash
cp .env.example .env
```

3. Run the development server:
```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### Classrooms
- `POST /classrooms` - Create classroom
- `GET /classrooms` - List all classrooms
- `GET /classrooms/{id}` - Get classroom by ID
- `GET /classrooms/{id}/students` - Get classroom students

### Students
- `POST /students` - Create student
- `GET /students/{id}` - Get student by ID
- `PATCH /students/{id}` - Update student

### Stories
- `POST /stories` - Create story
- `GET /stories/{id}` - Get story by ID
- `PATCH /stories/{id}` - Update story
- `GET /stories/{id}/full` - Get story with panels
- `GET /stories/{id}/complete` - Get story with panels and students
