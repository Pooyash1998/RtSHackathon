# Implementation Plan

- [ ] 1. Set up project structure and dependencies
  - Create backend directory with FastAPI project structure
  - Create frontend directory with React + TypeScript + Vite
  - Install backend dependencies: fastapi, uvicorn, supabase, openai, httpx, pydantic, reportlab, hypothesis, pytest
  - Install frontend dependencies: react, typescript, vite
  - Create .env.example files for both backend and frontend
  - Set up CORS middleware in FastAPI
  - _Requirements: 9.5_

- [ ] 2. Set up Supabase database schema
  - Create classrooms table with all fields and constraints
  - Create students table with foreign key to classrooms
  - Create stories table with foreign key to classrooms
  - Create panels table with foreign key to stories and unique constraint on (story_id, panel_number)
  - Create indexes on foreign keys and frequently queried fields
  - Enable Row Level Security policies
  - Set up storage bucket for images with public access
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 3. Implement data models and validation
- [ ] 3.1 Create Pydantic models for backend
  - Define ClassroomCreate, Classroom, StudentCreate, Student models
  - Define Story, Panel, StoryOption models
  - Define all request/response models with proper validation
  - Add Literal types for status and design_style enums
  - _Requirements: 1.1, 2.1, 9.6_

- [ ]* 3.2 Write property test for model validation
  - **Property 25: Request payload validation**
  - **Validates: Requirements 9.6**

- [ ] 3.3 Create TypeScript interfaces for frontend
  - Define all interfaces matching Pydantic models exactly
  - Create types directory with index.ts
  - _Requirements: 1.1, 2.1_

- [ ] 4. Implement database layer
- [ ] 4.1 Create Supabase client and connection utilities
  - Initialize Supabase client with environment variables
  - Create connection helper functions
  - _Requirements: 8.1_

- [ ] 4.2 Implement repository functions for CRUD operations
  - Classroom operations: insert_classroom, get_classroom, list_classrooms
  - Student operations: insert_student, get_student, get_students_by_classroom, update_student
  - Story operations: insert_story, get_story, update_story, get_stories_by_classroom
  - Panel operations: insert_panels, get_panels_by_story, update_panel
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.6_

- [ ]* 4.3 Write property test for foreign key constraints
  - **Property 21: Foreign key constraint enforcement**
  - **Validates: Requirements 8.2, 8.3**

- [ ]* 4.4 Write property test for UUID generation
  - **Property 2: Classroom ID uniqueness**
  - **Property 22: UUID identifier validity**
  - **Validates: Requirements 1.4, 8.4**

- [ ]* 4.5 Write property test for timestamp formatting
  - **Property 3: Timestamp format consistency**
  - **Validates: Requirements 1.5, 8.5**

- [ ] 5. Implement classroom management endpoints
- [ ] 5.1 Create classroom router with endpoints
  - POST /api/classrooms - create classroom
  - GET /api/classrooms/{classroom_id} - get classroom details
  - GET /api/classrooms - list all classrooms
  - GET /api/classrooms/{classroom_id}/students - get classroom students
  - GET /api/classrooms/{classroom_id}/stories - get classroom stories
  - _Requirements: 1.1, 1.2, 1.3, 2.6, 5.3_

- [ ]* 5.2 Write property test for classroom creation round-trip
  - **Property 1: Classroom creation round-trip**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 5.3 Write property test for classroom stories ordering
  - **Property 15: Classroom stories ordering**
  - **Validates: Requirements 5.3**

- [ ]* 5.4 Write unit tests for classroom endpoints
  - Test classroom creation with missing fields returns 400
  - Test get classroom with invalid ID returns 404
  - Test list classrooms returns array

- [ ] 6. Implement student management endpoints
- [ ] 6.1 Create student router with endpoints
  - POST /api/students - create student
  - GET /api/students/{student_id} - get student details
  - POST /api/students/{student_id}/photo - upload photo
  - POST /api/students/{student_id}/generate-avatar - trigger avatar generation
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 6.2 Write property test for student creation
  - **Property 4: Student creation with classroom linkage**
  - **Validates: Requirements 2.1**

- [ ]* 6.3 Write property test for photo upload
  - **Property 5: Photo upload returns accessible URL**
  - **Validates: Requirements 2.2**

- [ ]* 6.4 Write unit tests for student endpoints
  - Test student creation with invalid classroom_id returns 404
  - Test photo upload with invalid file type returns 400
  - Test get student with invalid ID returns 404

- [ ] 7. Implement FLUX service for image generation
- [ ] 7.1 Create FLUX service class
  - Implement generate_avatar method with FLUX API integration
  - Implement generate_panel_image method
  - Implement regenerate_panel_image method with correction prompts
  - Add retry logic with exponential backoff (3 retries)
  - Handle FLUX API errors gracefully
  - _Requirements: 2.3, 4.3, 6.1_

- [ ]* 7.2 Write unit tests for FLUX service
  - Test FLUX API error handling
  - Test retry logic with mocked failures
  - Test image URL validation

- [ ] 8. Implement avatar generation workflow
- [ ] 8.1 Create avatar service with async background task
  - Implement create_avatar method that calls FLUX service
  - Update student record with status "generating" immediately
  - Process avatar generation in background
  - Update student record with avatar_url and status "completed" on success
  - Update status to "failed" on error
  - _Requirements: 2.3, 2.4, 2.5, 10.1, 10.5_

- [ ]* 8.2 Write property test for avatar generation status
  - **Property 7: Avatar status during generation**
  - **Validates: Requirements 2.4**

- [ ]* 8.3 Write property test for avatar eventual completion
  - **Property 6: Avatar generation eventual completion**
  - **Validates: Requirements 2.3, 2.5**

- [ ]* 8.4 Write property test for async immediate response
  - **Property 26: Async operation immediate response**
  - **Validates: Requirements 10.1, 10.2**

- [ ] 9. Implement OpenAI service for story generation
- [ ] 9.1 Create OpenAI service class
  - Implement generate_story_options method using GPT-4
  - Build prompt incorporating classroom theme, subject, grade level, and students
  - Parse GPT-4 response into 3 StoryOption objects
  - Implement generate_story_narrative method for 20 panels
  - Build detailed prompt with selected option and lesson content
  - Parse GPT-4 response into panel narratives with scene descriptions
  - Add retry logic and error handling
  - _Requirements: 3.1, 3.3, 4.2_

- [ ]* 9.2 Write property test for story options generation
  - **Property 8: Story options count and structure**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 9.3 Write unit tests for OpenAI service
  - Test GPT-4 error handling returns descriptive error
  - Test prompt construction includes classroom context
  - Test response parsing handles malformed JSON

- [ ] 10. Implement story generation endpoints
- [ ] 10.1 Create story router with generation endpoints
  - POST /api/stories/generate-options - generate 3 story options
  - POST /api/stories/generate - trigger full story generation
  - GET /api/stories/{story_id}/progress - get generation progress
  - GET /api/stories/{story_id} - get complete story with panels
  - _Requirements: 3.1, 4.1, 4.7, 5.1_

- [ ]* 10.2 Write property test for story generation initial state
  - **Property 9: Story generation initial state**
  - **Validates: Requirements 4.1**

- [ ]* 10.3 Write property test for progress response structure
  - **Property 12: Story progress response structure**
  - **Validates: Requirements 4.7**

- [ ]* 10.4 Write unit tests for story endpoints
  - Test generate options with invalid classroom_id returns 404
  - Test get story with non-existent ID returns 404
  - Test progress endpoint returns current status

- [ ] 11. Implement full story generation workflow
- [ ] 11.1 Create story generation service with async background task
  - Create story record with status "generating" and progress 0
  - Call OpenAI service to generate 20 panel narratives
  - For each panel, call FLUX service to generate image
  - Update progress incrementally after each panel (progress = panels_completed * 5)
  - Create panel records in database as images complete
  - Update story status to "completed" and progress to 100 on success
  - Update status to "failed" on error, preserve partial panels
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 10.4, 10.5_

- [ ]* 11.2 Write property test for story progress monotonicity
  - **Property 10: Story progress monotonicity**
  - **Validates: Requirements 4.4**

- [ ]* 11.3 Write property test for story completion final state
  - **Property 11: Story completion final state**
  - **Validates: Requirements 4.5**

- [ ]* 11.4 Write property test for progress endpoint availability
  - **Property 27: Progress endpoint availability**
  - **Validates: Requirements 10.3**

- [ ]* 11.5 Write property test for async final persistence
  - **Property 28: Async operation final persistence**
  - **Validates: Requirements 10.5**

- [ ] 12. Implement story retrieval with complete data
- [ ] 12.1 Enhance story retrieval endpoint
  - Fetch story metadata from database
  - Fetch all panels sorted by panel_number
  - Fetch all students in classroom with avatar URLs
  - Return combined StoryDetailResponse
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ]* 12.2 Write property test for story retrieval completeness
  - **Property 13: Story retrieval completeness**
  - **Validates: Requirements 5.1, 5.2, 5.5**

- [ ]* 12.3 Write property test for panel sequence integrity
  - **Property 14: Panel sequence integrity**
  - **Validates: Requirements 5.4**

- [ ] 13. Implement panel regeneration
- [ ] 13.1 Create panel regeneration endpoint and service
  - POST /api/stories/{story_id}/regenerate - regenerate specific panels
  - Update story status to "regenerating"
  - For each specified panel, call FLUX service with correction prompt
  - Update panel image_url with new image
  - Restore story status to "completed" when done
  - Preserve original data if regeneration fails
  - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [ ]* 13.2 Write property test for selective panel regeneration
  - **Property 16: Selective panel regeneration**
  - **Validates: Requirements 6.1**

- [ ]* 13.3 Write property test for regeneration status transitions
  - **Property 17: Regeneration status transitions**
  - **Validates: Requirements 6.3, 6.4**

- [ ]* 13.4 Write unit tests for panel regeneration
  - Test regeneration with invalid panel numbers returns 400
  - Test regeneration preserves original data on failure
  - Test regeneration with empty correction prompt

- [ ] 14. Implement PDF export functionality
- [ ] 14.1 Create export service with PDF generation
  - Use ReportLab to create PDF document
  - Add story title, classroom name, and creation date to PDF metadata
  - Fetch all 20 panels with images and dialogue
  - Format panels in reading order with visual separation
  - Download images from URLs and embed in PDF
  - Implement uniform scaling logic that preserves aspect ratios across all layout options
  - Calculate panel dimensions to maintain consistent aspect ratio regardless of 2 or 4 panels per page layout
  - Return PDF as bytes or upload to Supabase storage
  - _Requirements: 7.1, 7.3, 7.4, 7.6_

- [ ] 14.2 Create export router with PDF endpoints
  - GET /api/stories/{story_id}/export/pdf - download PDF directly
  - POST /api/stories/{story_id}/export/pdf - get temporary URL
  - _Requirements: 7.1, 7.3_

- [ ]* 14.3 Write property test for PDF export completeness
  - **Property 18: PDF export completeness**
  - **Validates: Requirements 7.1**

- [ ]* 14.4 Write property test for PDF export response format
  - **Property 19: PDF export response format**
  - **Validates: Requirements 7.3**

- [ ]* 14.5 Write property test for PDF metadata inclusion
  - **Property 20: PDF metadata inclusion**
  - **Validates: Requirements 7.4**

- [ ]* 14.6 Write property test for PDF aspect ratio preservation
  - **Property 21: PDF panel aspect ratio preservation**
  - **Validates: Requirements 7.6**

- [ ]* 14.7 Write unit tests for PDF export
  - Test PDF generation with incomplete story returns 400
  - Test PDF download returns correct content type
  - Test PDF URL generation includes expiration

- [ ] 15. Implement API error handling and validation
- [ ] 15.1 Add global exception handlers
  - Handle validation errors (422) with field-level details
  - Handle not found errors (404) with entity information
  - Handle external service errors (502/503) with retry guidance
  - Handle server errors (500) with sanitized error messages
  - Add request ID to all error responses for tracking
  - _Requirements: 9.2, 9.3, 9.4_

- [ ]* 15.2 Write property test for success response codes
  - **Property 23: Success response status codes**
  - **Validates: Requirements 9.2**

- [ ]* 15.3 Write property test for client error response codes
  - **Property 24: Client error response status codes**
  - **Validates: Requirements 9.3**

- [ ]* 15.4 Write unit tests for error handling
  - Test validation error returns 422 with field details
  - Test not found returns 404 with entity type
  - Test server error returns 500 with sanitized message

- [ ] 16. Create frontend API client
- [ ] 16.1 Implement API client functions in lib/api.ts
  - Create base fetch wrapper with error handling
  - Implement all classroom API functions
  - Implement all student API functions
  - Implement all story API functions
  - Implement export API functions
  - Add TypeScript types for all requests/responses
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 4.1, 4.7, 5.1, 6.1, 7.1_

- [ ]* 16.2 Write unit tests for API client
  - Test error handling for network failures
  - Test request payload serialization
  - Test response parsing

- [ ] 17. Implement teacher UI components
- [ ] 17.1 Create ClassroomForm component
  - Form inputs for name, subject, grade_level, story_theme, design_style, duration
  - Form validation and error display
  - Call createClassroom API on submit
  - Redirect to classroom dashboard on success
  - _Requirements: 1.1_

- [ ] 17.2 Create ClassroomDashboard component
  - Fetch and display list of classrooms
  - Show student count and story count per classroom
  - Navigation to classroom detail page
  - _Requirements: 1.3_

- [ ] 17.3 Create ClassroomDetail component
  - Display classroom information
  - List all students with avatars
  - List all stories
  - Navigation to story generator and story viewer
  - _Requirements: 1.2, 2.6, 5.3_

- [ ] 17.4 Create StoryGenerator component
  - Step 1: Input lesson prompt
  - Step 2: Display 3 story options from API
  - Step 3: Select option and trigger generation
  - Navigate to progress tracker
  - _Requirements: 3.1, 4.1_

- [ ] 17.5 Create ProgressTracker component
  - Poll story progress every 2 seconds
  - Display progress bar and panels completed count
  - Show current status (generating, completed, failed)
  - Navigate to story viewer when completed
  - _Requirements: 4.7_

- [ ] 17.6 Create StoryViewer component
  - Display all 20 panels with images and dialogue
  - Panel regeneration interface with correction prompt input
  - Export to PDF button
  - Handle regeneration status updates
  - _Requirements: 5.1, 5.2, 6.1, 7.1_

- [ ] 18. Implement student UI components
- [ ] 18.1 Create StudentSignup component
  - Extract classroom_id from URL parameter
  - Form inputs for name and interests
  - Call createStudent API on submit
  - Navigate to avatar creator on success
  - _Requirements: 2.1_

- [ ] 18.2 Create AvatarCreator component
  - Optional photo upload with preview
  - Trigger avatar generation button
  - Display generating status
  - Show generated avatar when complete
  - Navigate to story list on completion
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 18.3 Create StudentStoryList component
  - Fetch and display all stories for student's classroom
  - Show story title, creation date, and thumbnail
  - Navigation to story reader
  - _Requirements: 5.3_

- [ ] 18.4 Create StoryReader component
  - Display panels in comic book style layout
  - Sequential reading experience with next/previous navigation
  - Full-screen mode for immersive reading
  - _Requirements: 5.1, 5.2_

- [ ] 19. Implement frontend routing
  - Set up React Router with routes for all pages
  - Teacher routes: /, /teacher/dashboard, /teacher/classroom/new, /teacher/classroom/:id, /teacher/story/new, /teacher/story/:id, /teacher/story/:id/export
  - Student routes: /join/:classroom_id, /student/avatar/create, /student/stories, /student/story/:id
  - Add navigation components and breadcrumbs
  - _Requirements: All UI requirements_

- [ ] 20. Add loading states and error handling to UI
  - Loading spinners for async operations
  - Error messages for failed API calls
  - Retry buttons for failed operations
  - Toast notifications for success/error feedback
  - _Requirements: 9.3, 9.4_

- [ ] 21. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Set up deployment configuration
  - Configure Vercel for frontend deployment
  - Configure Railway for backend deployment
  - Set up environment variables in deployment platforms
  - Configure CORS to allow frontend domain
  - Set up health check endpoint for backend
  - _Requirements: 9.5_

- [ ] 23. Create documentation
  - README with project overview and setup instructions
  - API documentation with endpoint descriptions
  - Environment variables documentation
  - Deployment guide
  - _Requirements: All requirements_

- [ ] 24. Final integration testing
  - Test complete teacher workflow: create classroom → generate story → export PDF
  - Test complete student workflow: join classroom → create avatar → read story
  - Test error scenarios: invalid IDs, network failures, generation failures
  - Test concurrent operations: multiple story generations
  - _Requirements: All requirements_
