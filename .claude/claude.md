# EduComic - Classroom Story Platform

## Project Overview

The Classroom Story Platform is an educational web application that enables teachers to create AI-generated comic stories featuring their students as characters. Teachers set up classrooms with themes and design styles, students create personalized avatars, and the system generates 20-panel comic stories based on lesson content using GPT-4 for narratives and FLUX for artwork.

## Technology Stack

### Backend
- **FastAPI**: Python web framework for REST API
- **Pydantic**: Data validation and serialization
- **Supabase Python Client**: Database and storage access
- **OpenAI Python SDK**: GPT-4 integration
- **HTTPX**: Async HTTP client for FLUX API
- **ReportLab**: PDF generation
- **Hypothesis**: Property-based testing
- **Pytest**: Unit testing

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite**: Build tool and dev server
- **Fetch API**: HTTP client for backend communication

### Infrastructure
- **Supabase**: PostgreSQL database and file storage
- **Vercel**: Frontend hosting
- **Railway**: Backend hosting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │  Teacher UI      │         │   Student UI     │         │
│  │  - Classrooms    │         │   - Signup       │         │
│  │  - Story Gen     │         │   - Avatar       │         │
│  │  - Export        │         │   - Story View   │         │
│  └──────────────────┘         └──────────────────┘         │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                  API Routers                          │  │
│  │  /classrooms  /students  /stories  /export           │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Logic Services                  │  │
│  │  - OpenAI Service (GPT-4)                            │  │
│  │  - FLUX Service (Image Generation)                   │  │
│  │  - Avatar Service                                     │  │
│  │  - Story Generation Service                           │  │
│  │  - Export Service (PDF)                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database Layer                           │  │
│  │  - Supabase Client                                    │  │
│  │  - Repository Pattern                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
        ┌───────▼────────┐     ┌───────▼────────┐
        │   Supabase     │     │  External APIs  │
        │   PostgreSQL   │     │  - OpenAI       │
        │   Storage      │     │  - FLUX         │
        └────────────────┘     └─────────────────┘
```

## Database Schema

```sql
-- Classrooms table
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    story_theme TEXT NOT NULL,
    design_style TEXT NOT NULL CHECK (design_style IN ('manga', 'comic', 'cartoon')),
    duration TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    interests TEXT NOT NULL,
    avatar_url TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    lesson_prompt TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('generating', 'completed', 'failed', 'regenerating')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Panels table
CREATE TABLE panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    panel_number INTEGER NOT NULL CHECK (panel_number >= 1 AND panel_number <= 20),
    image_url TEXT NOT NULL,
    dialogue TEXT NOT NULL,
    scene_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, panel_number)
);

-- Indexes for performance
CREATE INDEX idx_students_classroom ON students(classroom_id);
CREATE INDEX idx_stories_classroom ON stories(classroom_id);
CREATE INDEX idx_panels_story ON panels(story_id);
CREATE INDEX idx_panels_story_number ON panels(story_id, panel_number);
```

## Key API Endpoints

### Classroom Management
- `POST /api/classrooms` - Create new classroom
- `GET /api/classrooms/{classroom_id}` - Get classroom details
- `GET /api/classrooms` - List all classrooms
- `GET /api/classrooms/{classroom_id}/students` - Get classroom students
- `GET /api/classrooms/{classroom_id}/stories` - Get classroom stories

### Student Management
- `POST /api/students` - Create student
- `GET /api/students/{student_id}` - Get student details
- `POST /api/students/{student_id}/photo` - Upload student photo
- `POST /api/students/{student_id}/generate-avatar` - Generate avatar

### Story Generation
- `POST /api/stories/generate-options` - Generate 3 story options
- `POST /api/stories/generate` - Generate full 20-panel story
- `GET /api/stories/{story_id}/progress` - Get generation progress
- `GET /api/stories/{story_id}` - Get complete story with panels
- `POST /api/stories/{story_id}/regenerate` - Regenerate specific panels

### Export
- `GET /api/stories/{story_id}/export/pdf` - Download PDF
- `POST /api/stories/{story_id}/export/pdf` - Get PDF URL

## Core User Workflows

### Teacher Workflow
1. Create classroom with name, subject, grade level, theme, and design style
2. Share invite link with students
3. Input lesson prompt to generate 3 story options
4. Select preferred option to trigger full 20-panel story generation
5. Monitor progress via polling endpoint
6. Review completed story
7. Optionally regenerate specific panels with correction prompts
8. Export story as PDF for classroom distribution

### Student Workflow
1. Join classroom via invite link
2. Enter name and interests
3. Optionally upload photo
4. Generate personalized avatar using FLUX AI
5. View list of available stories for classroom
6. Read stories in comic book format

## Asynchronous Operations

### Avatar Generation
- Immediate response with status "generating"
- Background task invokes FLUX API
- Updates student record with avatar_url on completion
- Typical completion time: < 60 seconds

### Story Generation
- Immediate response with story_id and status "generating"
- Background process:
  1. GPT-4 generates 20 panel narratives
  2. FLUX generates image for each panel
  3. Progress updates incrementally (5% per panel)
  4. Creates panel records in database
- Typical completion time: < 10 minutes
- Status transitions: generating → completed/failed

### Panel Regeneration
- Status changes to "regenerating"
- Only specified panels updated
- Original data preserved until success
- Status returns to "completed" when done

## Testing Strategy

### Property-Based Testing (Hypothesis)
The project uses property-based testing to verify correctness properties across random inputs. Each property test runs 100+ iterations with randomized data.

**Key Properties:**
- **Property 1**: Classroom creation round-trip preserves all fields
- **Property 2**: All classroom IDs are unique UUIDs
- **Property 3**: Timestamps follow ISO 8601 format
- **Property 8**: Story options always return exactly 3 options
- **Property 10**: Story progress is monotonically increasing
- **Property 11**: Completed stories have 20 panels and progress 100
- **Property 14**: Panel numbers form complete sequence 1-20
- **Property 16**: Selective regeneration only updates specified panels

### Unit Testing (Pytest/Vitest)
- API endpoint validation and error handling
- Database CRUD operations
- Pydantic model validation
- Service layer business logic
- Frontend component rendering

### Integration Testing
- End-to-end classroom → student → story generation flow
- External service mocking (OpenAI, FLUX)
- Error recovery and retry logic

## Error Handling

### Categories
1. **Validation Errors (400)**: Invalid payloads, missing fields
2. **Not Found (404)**: Non-existent entities
3. **External Service Errors (502/503)**: API failures
4. **Generation Failures**: Update status to "failed", preserve partial results
5. **Timeout Errors (504)**: Long-running operations exceed limits

### Strategies
- **Retry Logic**: 3 retries with exponential backoff for external APIs
- **Graceful Degradation**: Preserve partial results on failure
- **User-Facing Messages**: Clear, actionable error descriptions

## Performance Targets

- API endpoints (non-generation): < 200ms
- Story option generation: < 30 seconds
- Avatar generation: < 60 seconds
- Full story generation: < 10 minutes
- Panel regeneration: < 2 minutes per panel
- PDF export: < 60 seconds

## Current Implementation Status

The project follows a structured implementation plan with 24 major tasks:

### Completed
- [ ] Project structure and dependencies setup
- [ ] Database schema creation
- [ ] Data models and validation

### In Progress
- [ ] Backend API implementation
- [ ] Service layer (OpenAI, FLUX, Avatar, Export)
- [ ] Frontend components

### Pending
- [ ] Property-based tests
- [ ] Integration testing
- [ ] Deployment configuration

## Development Guidelines

### Code Organization
- **Backend**: `/backend` - FastAPI app, routers, services, database layer
- **Frontend**: `/frontend` - React components, API client, routing
- **Database**: Supabase hosted PostgreSQL
- **Tests**: Property tests tagged as `Property {N}: {description}`

### Key Principles
1. **Separation of Concerns**: Clear boundaries between API, services, and data layers
2. **Async-First**: All generation operations run asynchronously
3. **Type Safety**: Pydantic models (backend), TypeScript interfaces (frontend)
4. **Error Resilience**: Retry logic, graceful degradation, detailed error messages
5. **Testing**: Property-based tests for correctness, unit tests for functionality

## Environment Variables

### Backend
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_KEY`: Supabase API key
- `OPENAI_API_KEY`: OpenAI API key for GPT-4
- `FLUX_API_KEY`: FLUX API key for image generation

### Frontend
- `VITE_API_URL`: Backend API base URL

## Next Steps

Refer to [tasks.md](.kiro/specs/classroom-story-platform/tasks.md) for the complete implementation plan with 24 major tasks and 100+ subtasks. Each task is linked to specific requirements and includes property tests to verify correctness.
