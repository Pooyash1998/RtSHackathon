# Design Document

## Overview

The Classroom Story Platform is a full-stack web application built with FastAPI (backend), React (frontend), Supabase (database), and AI services (GPT-4, FLUX). The architecture follows a clean separation between API layer, business logic, data persistence, and external service integrations. The system handles asynchronous AI generation workflows with progress tracking, supports concurrent user operations, and provides RESTful endpoints for all functionality.

## Architecture

### High-Level Architecture

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

### Technology Stack

**Backend:**
- FastAPI: Python web framework for REST API
- Pydantic: Data validation and serialization
- Supabase Python Client: Database and storage access
- OpenAI Python SDK: GPT-4 integration
- HTTPX: Async HTTP client for FLUX API
- ReportLab: PDF generation

**Frontend:**
- React 18: UI framework
- TypeScript: Type-safe development
- Vite: Build tool and dev server
- Fetch API: HTTP client for backend communication

**Infrastructure:**
- Supabase: PostgreSQL database and file storage
- Vercel: Frontend hosting
- Railway: Backend hosting
- Environment variables for API keys and configuration

## Components and Interfaces

### Backend Components

#### 1. API Routers

**ClassroomRouter** (`routers/classrooms.py`)
```python
@router.post("/api/classrooms")
async def create_classroom(classroom: ClassroomCreate) -> Classroom

@router.get("/api/classrooms/{classroom_id}")
async def get_classroom(classroom_id: str) -> Classroom

@router.get("/api/classrooms")
async def list_classrooms() -> List[Classroom]

@router.get("/api/classrooms/{classroom_id}/students")
async def get_classroom_students(classroom_id: str) -> List[Student]

@router.get("/api/classrooms/{classroom_id}/stories")
async def get_classroom_stories(classroom_id: str) -> List[Story]
```

**StudentRouter** (`routers/students.py`)
```python
@router.post("/api/students")
async def create_student(student: StudentCreate) -> Student

@router.get("/api/students/{student_id}")
async def get_student(student_id: str) -> Student

@router.post("/api/students/{student_id}/photo")
async def upload_photo(student_id: str, photo: UploadFile) -> PhotoUploadResponse

@router.post("/api/students/{student_id}/generate-avatar")
async def generate_avatar(student_id: str, request: AvatarGenerateRequest) -> AvatarGenerateResponse
```

**StoryRouter** (`routers/stories.py`)
```python
@router.post("/api/stories/generate-options")
async def generate_story_options(request: StoryOptionsRequest) -> StoryOptionsResponse

@router.post("/api/stories/generate")
async def generate_story(request: StoryGenerateRequest) -> StoryGenerateResponse

@router.get("/api/stories/{story_id}/progress")
async def get_story_progress(story_id: str) -> StoryProgressResponse

@router.get("/api/stories/{story_id}")
async def get_story(story_id: str) -> StoryDetailResponse

@router.post("/api/stories/{story_id}/regenerate")
async def regenerate_panels(story_id: str, request: RegenerateRequest) -> RegenerateResponse
```

**ExportRouter** (`routers/export.py`)
```python
@router.get("/api/stories/{story_id}/export/pdf")
async def export_pdf_download(story_id: str) -> FileResponse

@router.post("/api/stories/{story_id}/export/pdf")
async def export_pdf_url(story_id: str) -> ExportPDFResponse
```

#### 2. Service Layer

**OpenAIService** (`services/openai_service.py`)
```python
class OpenAIService:
    async def generate_story_options(
        classroom: Classroom,
        students: List[Student],
        lesson_prompt: str
    ) -> List[StoryOption]
    
    async def generate_story_narrative(
        classroom: Classroom,
        students: List[Student],
        selected_option: StoryOption,
        lesson_prompt: str
    ) -> List[PanelNarrative]
```

**FLUXService** (`services/flux_service.py`)
```python
class FLUXService:
    async def generate_avatar(
        student_name: str,
        interests: str,
        photo_url: Optional[str],
        design_style: str
    ) -> str  # Returns image URL
    
    async def generate_panel_image(
        scene_description: str,
        character_descriptions: List[str],
        design_style: str
    ) -> str  # Returns image URL
    
    async def regenerate_panel_image(
        original_scene: str,
        correction_prompt: str,
        character_descriptions: List[str],
        design_style: str
    ) -> str  # Returns image URL
```

**AvatarService** (`services/avatar_service.py`)
```python
class AvatarService:
    async def create_avatar(
        student_id: str,
        use_photo: bool
    ) -> None  # Updates student record asynchronously
```

**StoryGenerationService** (`services/story_generation.py`)
```python
class StoryGenerationService:
    async def generate_full_story(
        story_id: str,
        classroom_id: str,
        selected_option: StoryOption,
        lesson_prompt: str
    ) -> None  # Updates story and panels asynchronously
    
    async def regenerate_panels(
        story_id: str,
        panel_numbers: List[int],
        correction_prompt: str
    ) -> None  # Updates panels asynchronously
```

**ExportService** (`services/export_service.py`)
```python
class ExportService:
    async def generate_pdf(
        story: Story,
        panels: List[Panel],
        classroom: Classroom
    ) -> bytes  # Returns PDF binary data
    
    async def upload_pdf_to_storage(
        pdf_data: bytes,
        story_id: str
    ) -> str  # Returns public URL
```

#### 3. Database Layer

**Database Client** (`database.py`)
```python
from supabase import create_client, Client

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Repository functions
async def insert_classroom(classroom_data: dict) -> dict
async def get_classroom(classroom_id: str) -> dict
async def insert_student(student_data: dict) -> dict
async def get_students_by_classroom(classroom_id: str) -> List[dict]
async def insert_story(story_data: dict) -> dict
async def update_story(story_id: str, updates: dict) -> dict
async def insert_panels(panels_data: List[dict]) -> List[dict]
async def get_story_with_panels(story_id: str) -> dict
```

### Frontend Components

#### Teacher Components (`components/teacher/`)

**ClassroomForm.tsx**
- Form for creating new classrooms
- Inputs: name, subject, grade_level, story_theme, design_style, duration
- Calls: `POST /api/classrooms`

**ClassroomDashboard.tsx**
- Lists all teacher's classrooms
- Shows student count and story count per classroom
- Calls: `GET /api/classrooms`

**StoryGenerator.tsx**
- Step 1: Input lesson prompt
- Step 2: Display 3 story options from GPT-4
- Step 3: Trigger full story generation
- Calls: `POST /api/stories/generate-options`, `POST /api/stories/generate`

**StoryViewer.tsx**
- Displays all 20 panels with images and dialogue
- Allows panel regeneration with correction prompts
- Export to PDF button
- Calls: `GET /api/stories/{id}`, `POST /api/stories/{id}/regenerate`, `GET /api/stories/{id}/export/pdf`

**ProgressTracker.tsx**
- Polls story generation progress
- Shows progress bar and panels completed count
- Calls: `GET /api/stories/{id}/progress` (polling every 2 seconds)

#### Student Components (`components/student/`)

**StudentSignup.tsx**
- Form for joining classroom via invite link
- Inputs: name, interests
- Calls: `POST /api/students`

**AvatarCreator.tsx**
- Optional photo upload
- Trigger avatar generation
- Display generated avatar
- Calls: `POST /api/students/{id}/photo`, `POST /api/students/{id}/generate-avatar`

**StoryReader.tsx**
- Comic book style panel display
- Sequential reading experience
- Calls: `GET /api/stories/{id}`

**StudentStoryList.tsx**
- Lists all stories for student's classroom
- Calls: `GET /api/classrooms/{id}/stories`

#### Shared Components

**API Client** (`lib/api.ts`)
```typescript
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function createClassroom(data: ClassroomCreate): Promise<Classroom>
export async function getClassroom(id: string): Promise<Classroom>
export async function createStudent(data: StudentCreate): Promise<Student>
export async function uploadStudentPhoto(studentId: string, photo: File): Promise<PhotoUploadResponse>
export async function generateAvatar(studentId: string, usePhoto: boolean): Promise<AvatarGenerateResponse>
export async function generateStoryOptions(classroomId: string, lessonPrompt: string): Promise<StoryOptionsResponse>
export async function generateStory(classroomId: string, selectedOptionId: string, lessonPrompt: string): Promise<StoryGenerateResponse>
export async function getStoryProgress(storyId: string): Promise<StoryProgressResponse>
export async function getStory(storyId: string): Promise<StoryDetailResponse>
export async function regeneratePanels(storyId: string, panelNumbers: number[], correctionPrompt: string): Promise<RegenerateResponse>
export async function exportStoryPDF(storyId: string): Promise<Blob>
```

## Data Models

### Database Schema (Supabase PostgreSQL)

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

### Pydantic Models (Backend)

```python
from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime

# Classroom models
class ClassroomCreate(BaseModel):
    name: str
    subject: str
    grade_level: str
    story_theme: str
    design_style: Literal["manga", "comic", "cartoon"] = "manga"
    duration: str

class Classroom(BaseModel):
    id: str
    name: str
    subject: str
    grade_level: str
    story_theme: str
    design_style: str
    duration: str
    created_at: str

# Student models
class StudentCreate(BaseModel):
    classroom_id: str
    name: str
    interests: str

class Student(BaseModel):
    id: str
    classroom_id: str
    name: str
    interests: str
    avatar_url: Optional[str] = None
    photo_url: Optional[str] = None
    created_at: str

class PhotoUploadResponse(BaseModel):
    photo_url: str

class AvatarGenerateRequest(BaseModel):
    use_photo: bool

class AvatarGenerateResponse(BaseModel):
    avatar_url: Optional[str] = None
    status: Literal["generating", "completed"]

# Story models
class StoryOption(BaseModel):
    id: str
    title: str
    summary: str
    theme: str

class StoryOptionsRequest(BaseModel):
    classroom_id: str
    lesson_prompt: str

class StoryOptionsResponse(BaseModel):
    options: List[StoryOption]

class StoryGenerateRequest(BaseModel):
    classroom_id: str
    selected_option_id: str
    lesson_prompt: str

class StoryGenerateResponse(BaseModel):
    story_id: str
    status: Literal["generating"]
    progress: int = 0

class StoryProgressResponse(BaseModel):
    story_id: str
    status: Literal["generating", "completed", "failed", "regenerating"]
    progress: int
    panels_completed: int

class Panel(BaseModel):
    id: str
    story_id: str
    panel_number: int
    image_url: str
    dialogue: str
    scene_description: str
    created_at: str

class Story(BaseModel):
    id: str
    classroom_id: str
    lesson_prompt: str
    title: str
    status: Literal["generating", "completed", "failed", "regenerating"]
    progress: int
    created_at: str

class StoryDetailResponse(BaseModel):
    story: Story
    panels: List[Panel]
    students: List[Student]

class RegenerateRequest(BaseModel):
    panel_numbers: List[int]
    correction_prompt: str

class RegenerateResponse(BaseModel):
    status: Literal["regenerating"]

# Export models
class ExportPDFResponse(BaseModel):
    pdf_url: str
    expires_at: str
```

### TypeScript Interfaces (Frontend)

```typescript
// Matches backend Pydantic models exactly
export interface Classroom {
  id: string;
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: "manga" | "comic" | "cartoon";
  duration: string;
  created_at: string;
}

export interface Student {
  id: string;
  classroom_id: string;
  name: string;
  interests: string;
  avatar_url: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Story {
  id: string;
  classroom_id: string;
  lesson_prompt: string;
  title: string;
  status: "generating" | "completed" | "failed" | "regenerating";
  progress: number;
  created_at: string;
}

export interface Panel {
  id: string;
  story_id: string;
  panel_number: number;
  image_url: string;
  dialogue: string;
  scene_description: string;
  created_at: string;
}

export interface StoryOption {
  id: string;
  title: string;
  summary: string;
  theme: string;
}

// Request/Response types
export interface ClassroomCreate {
  name: string;
  subject: string;
  grade_level: string;
  story_theme: string;
  design_style: "manga" | "comic" | "cartoon";
  duration: string;
}

export interface StudentCreate {
  classroom_id: string;
  name: string;
  interests: string;
}

export interface StoryOptionsResponse {
  options: StoryOption[];
}

export interface StoryDetailResponse {
  story: Story;
  panels: Panel[];
  students: Student[];
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Classroom creation round-trip
*For any* valid classroom creation data, creating a classroom and then retrieving it should return a record containing all the submitted fields with matching values.
**Validates: Requirements 1.1, 1.2**

### Property 2: Classroom ID uniqueness
*For any* set of created classrooms, all classroom IDs should be unique valid UUIDs.
**Validates: Requirements 1.4**

### Property 3: Timestamp format consistency
*For any* created entity (classroom, student, story, panel), the created_at timestamp should be a valid ISO 8601 formatted string.
**Validates: Requirements 1.5, 8.5**

### Property 4: Student creation with classroom linkage
*For any* valid student creation data with a valid classroom ID, creating a student should return a record linked to that classroom with all submitted fields.
**Validates: Requirements 2.1**

### Property 5: Photo upload returns accessible URL
*For any* valid image file uploaded for a student, the returned photo URL should be publicly accessible and return the image data.
**Validates: Requirements 2.2**

### Property 6: Avatar generation eventual completion
*For any* student with avatar generation triggered, polling the student record should eventually show status "completed" with a non-null avatar_url.
**Validates: Requirements 2.3, 2.5**

### Property 7: Avatar status during generation
*For any* student with avatar generation in progress, the status should remain "generating" until the avatar_url is populated.
**Validates: Requirements 2.4**

### Property 8: Story options count and structure
*For any* valid lesson prompt and classroom ID, generating story options should return exactly 3 options, each containing title, summary, and theme fields.
**Validates: Requirements 3.1, 3.3**

### Property 9: Story generation initial state
*For any* story generation request, the immediately returned story should have status "generating" and progress 0.
**Validates: Requirements 4.1**

### Property 10: Story progress monotonicity
*For any* story being generated, successive progress checks should show progress values that are non-decreasing and eventually reach 100.
**Validates: Requirements 4.4**

### Property 11: Story completion final state
*For any* successfully generated story, the final state should have status "completed", progress 100, and exactly 20 panels.
**Validates: Requirements 4.5**

### Property 12: Story progress response structure
*For any* story progress request, the response should contain story_id, status, progress (0-100), and panels_completed count.
**Validates: Requirements 4.7**

### Property 13: Story retrieval completeness
*For any* completed story, retrieving it should return the story metadata, all 20 panels sorted by panel_number (1-20), and all featured students with avatar data.
**Validates: Requirements 5.1, 5.2, 5.5**

### Property 14: Panel sequence integrity
*For any* completed story, the panels should have panel_numbers forming a complete sequence from 1 to 20 with no gaps or duplicates.
**Validates: Requirements 5.4**

### Property 15: Classroom stories ordering
*For any* classroom with multiple stories, retrieving the stories list should return them sorted by created_at in descending order (newest first).
**Validates: Requirements 5.3**

### Property 16: Selective panel regeneration
*For any* completed story and subset of panel numbers, triggering regeneration should eventually update only those specified panels' image URLs while preserving others.
**Validates: Requirements 6.1**

### Property 17: Regeneration status transitions
*For any* story with panel regeneration triggered, the status should transition to "regenerating" during the operation and return to "completed" when finished.
**Validates: Requirements 6.3, 6.4**

### Property 18: PDF export completeness
*For any* completed story, exporting to PDF should produce a document containing all 20 panels with their dialogue text in sequential order.
**Validates: Requirements 7.1**

### Property 19: PDF export response format
*For any* PDF export request, the response should provide either a downloadable file or a URL with an expiration timestamp.
**Validates: Requirements 7.3**

### Property 20: PDF metadata inclusion
*For any* exported story PDF, the PDF metadata should contain the story title, classroom name, and creation date.
**Validates: Requirements 7.4**

### Property 21: Foreign key constraint enforcement
*For any* attempt to create a student with an invalid classroom_id or a panel with an invalid story_id, the Platform should reject the operation with an error.
**Validates: Requirements 8.1, 8.2, 8.3**

### Property 22: UUID identifier validity
*For any* created entity (classroom, student, story, panel), the ID should be a valid UUID format.
**Validates: Requirements 8.4**

### Property 23: Success response status codes
*For any* valid API request that succeeds, the HTTP response status code should be in the 2xx range.
**Validates: Requirements 9.2**

### Property 24: Client error response status codes
*For any* API request with invalid input data, the HTTP response status code should be in the 4xx range with a descriptive error message.
**Validates: Requirements 9.3**

### Property 25: Request payload validation
*For any* API request with a payload that doesn't match the expected schema, the Platform should reject it with a validation error before processing.
**Validates: Requirements 9.6**

### Property 26: Async operation immediate response
*For any* avatar generation or story generation request, the API should return a response within 1 second with status "generating".
**Validates: Requirements 10.1, 10.2**

### Property 27: Progress endpoint availability
*For any* asynchronous operation (avatar or story generation), the progress/status endpoint should be queryable and return current state.
**Validates: Requirements 10.3**

### Property 28: Async operation final persistence
*For any* asynchronous operation that completes or fails, the final status should be persisted in the database and retrievable.
**Validates: Requirements 10.5**

## Error Handling

### Error Categories

**1. Validation Errors (4xx)**
- Invalid request payloads (missing fields, wrong types)
- Invalid UUIDs or foreign key references
- Invalid file uploads (wrong format, too large)
- Response: 400 Bad Request with detailed validation errors

**2. Not Found Errors (404)**
- Classroom, student, story, or panel not found
- Response: 404 Not Found with entity type and ID

**3. External Service Errors (502/503)**
- OpenAI API failures
- FLUX API failures
- Supabase connection issues
- Response: 502 Bad Gateway or 503 Service Unavailable with retry guidance

**4. Generation Failures**
- Story generation fails mid-process
- Avatar generation fails
- Panel regeneration fails
- Action: Update status to "failed", preserve partial results, log error details

**5. Timeout Errors (504)**
- Long-running operations exceed timeout
- Response: 504 Gateway Timeout with operation ID for status checking

### Error Handling Strategies

**Retry Logic:**
- External API calls: 3 retries with exponential backoff
- Database operations: 2 retries with 1-second delay
- File uploads: No automatic retry (user-initiated)

**Graceful Degradation:**
- If avatar generation fails, allow story generation to proceed with placeholder
- If single panel generation fails, mark story as "failed" but preserve completed panels
- If PDF generation fails, provide error message but keep story accessible

**Error Logging:**
- All errors logged with timestamp, request ID, user context, and stack trace
- External API errors include request/response details (sanitized)
- Database errors include query details (parameterized)

**User-Facing Messages:**
- Validation errors: Specific field-level feedback
- Service errors: "Service temporarily unavailable, please try again"
- Generation failures: "Generation failed, please try again or contact support"

## Testing Strategy

### Unit Testing

**Framework:** pytest for backend, Vitest for frontend

**Backend Unit Tests:**
- Pydantic model validation (valid/invalid inputs)
- Database repository functions (CRUD operations)
- API endpoint request/response handling
- Error response formatting
- UUID generation and validation
- Timestamp formatting

**Frontend Unit Tests:**
- API client functions (mocked responses)
- Component rendering with various props
- Form validation logic
- Error state handling
- Progress calculation utilities

**Key Unit Test Examples:**
- Test classroom creation with missing required fields returns 400
- Test student creation with invalid classroom_id returns 404
- Test story retrieval with non-existent ID returns 404
- Test panel number validation rejects values outside 1-20 range
- Test PDF metadata extraction returns correct fields

### Property-Based Testing

**Framework:** Hypothesis for Python backend

**Configuration:**
- Minimum 100 iterations per property test
- Use Hypothesis strategies for data generation
- Each test tagged with format: `**Feature: classroom-story-platform, Property {N}: {description}**`

**Property Test Coverage:**

**Data Integrity Properties:**
- Property 1: Classroom creation round-trip (test with random valid classroom data)
- Property 2: Classroom ID uniqueness (generate multiple classrooms, verify unique IDs)
- Property 3: Timestamp format consistency (create random entities, validate ISO 8601)
- Property 4: Student creation with classroom linkage (random student data)
- Property 14: Panel sequence integrity (verify 1-20 sequence for any story)
- Property 22: UUID identifier validity (validate UUID format for all entities)

**API Behavior Properties:**
- Property 8: Story options count and structure (random prompts return 3 options)
- Property 23: Success response status codes (valid requests return 2xx)
- Property 24: Client error response status codes (invalid requests return 4xx)
- Property 25: Request payload validation (malformed payloads rejected)

**Async Operation Properties:**
- Property 10: Story progress monotonicity (progress never decreases)
- Property 26: Async operation immediate response (< 1 second response time)
- Property 27: Progress endpoint availability (queryable during generation)

**Data Retrieval Properties:**
- Property 13: Story retrieval completeness (all data present and sorted)
- Property 15: Classroom stories ordering (descending by date)

**Generation Properties:**
- Property 6: Avatar generation eventual completion (eventually completes)
- Property 11: Story completion final state (20 panels, status completed)
- Property 16: Selective panel regeneration (only specified panels change)

### Integration Testing

**Test Scenarios:**
1. End-to-end classroom creation → student signup → avatar generation flow
2. Full story generation workflow with progress polling
3. Panel regeneration with correction prompts
4. PDF export with file download
5. Error recovery: retry after failed generation
6. Concurrent story generation for same classroom

**External Service Mocking:**
- Mock OpenAI API responses for consistent testing
- Mock FLUX API responses with test images
- Use Supabase test database with isolated data

### Manual Testing Checklist

**Teacher Workflow:**
- [ ] Create classroom with all design styles (manga, comic, cartoon)
- [ ] Generate story options with various lesson prompts
- [ ] Select option and monitor full story generation
- [ ] Regenerate specific panels with corrections
- [ ] Export story as PDF and verify content
- [ ] View all classroom stories in dashboard

**Student Workflow:**
- [ ] Join classroom via invite link
- [ ] Upload photo and generate avatar
- [ ] Generate avatar without photo
- [ ] View all available stories
- [ ] Read story in comic reader interface

**Error Scenarios:**
- [ ] Invalid classroom ID in student signup
- [ ] Network failure during story generation
- [ ] Corrupted image upload
- [ ] Concurrent regeneration requests

## Performance Considerations

**Response Time Targets:**
- API endpoints (non-generation): < 200ms
- Story option generation: < 30 seconds
- Avatar generation: < 60 seconds
- Full story generation: < 10 minutes
- Panel regeneration: < 2 minutes per panel
- PDF export: < 60 seconds

**Scalability:**
- Database: Supabase handles up to 10,000 concurrent connections
- Background tasks: Use FastAPI BackgroundTasks for async operations
- File storage: Supabase storage with CDN for image delivery
- Rate limiting: 100 requests per minute per IP for generation endpoints

**Optimization Strategies:**
- Cache classroom and student data during story generation
- Batch panel image generation requests to FLUX
- Use database indexes on foreign keys and frequently queried fields
- Compress images before storage
- Implement pagination for classroom/story lists (20 items per page)

## Deployment Architecture

**Frontend (Vercel):**
- Automatic deployments from main branch
- Environment variables: VITE_API_URL
- CDN distribution for static assets
- Preview deployments for pull requests

**Backend (Railway):**
- Automatic deployments from main branch
- Environment variables: SUPABASE_URL, SUPABASE_KEY, OPENAI_API_KEY, FLUX_API_KEY
- Health check endpoint: GET /health
- Auto-scaling based on CPU usage

**Database (Supabase):**
- PostgreSQL with automatic backups
- Row-level security policies for multi-tenancy
- Storage bucket for images with public access
- Connection pooling enabled

**Monitoring:**
- Backend: Railway logs and metrics
- Frontend: Vercel analytics
- Database: Supabase dashboard
- Error tracking: Log errors to console (upgrade to Sentry for production)

## Security Considerations

**Authentication:**
- Phase 1 (Hackathon): No authentication, classroom IDs act as access tokens
- Phase 2 (Production): Add teacher authentication with JWT tokens
- Phase 3: Add student authentication with classroom-scoped access

**Data Validation:**
- All inputs validated with Pydantic schemas
- File uploads: Max 10MB, image formats only (JPEG, PNG)
- SQL injection prevention: Parameterized queries via Supabase client
- XSS prevention: React auto-escapes rendered content

**API Security:**
- CORS: Allow frontend domain only
- Rate limiting: 100 requests/minute per IP
- API keys: Stored in environment variables, never in code
- HTTPS only in production

**Data Privacy:**
- Student photos: Optional, stored with consent
- Generated content: Owned by classroom/teacher
- No PII collection beyond names and interests
- GDPR compliance: Data deletion on request (future feature)
