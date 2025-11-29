"""
FastAPI main application entry point.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from services.avatar import generate_avatar

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="EduComic API",
    description="API for educational comic generation",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "EduComic API is running", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "supabase_configured": bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))
    }

@app.get("/classrooms")
async def get_classrooms():
    """
    Get all classrooms.
    
    Returns:
        List of all classroom records with student counts
    """
    from database.database import get_all_classrooms, get_students_by_classroom, get_chapters_by_classroom
    
    try:
        classrooms = get_all_classrooms()
        
        # Add student count and story count to each classroom
        for classroom in classrooms:
            students = get_students_by_classroom(classroom["id"])
            chapters = get_chapters_by_classroom(classroom["id"])
            classroom["student_count"] = len(students)
            classroom["story_count"] = len(chapters)
        
        return {"success": True, "classrooms": classrooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch classrooms: {str(e)}")

@app.get("/classrooms/{classroom_id}")
async def get_classroom(classroom_id: str):
    """
    Get a specific classroom with students.
    
    Args:
        classroom_id: UUID of the classroom
        
    Returns:
        Classroom record with students array
    """
    from database.database import get_classroom_with_students
    
    try:
        classroom = get_classroom_with_students(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        return {"success": True, "classroom": classroom}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch classroom: {str(e)}")

@app.get("/classrooms/{classroom_id}/students")
async def get_classroom_students(classroom_id: str):
    """
    Get all students in a classroom.
    
    Args:
        classroom_id: UUID of the classroom
        
    Returns:
        List of student records
    """
    from database.database import get_students_by_classroom
    
    try:
        students = get_students_by_classroom(classroom_id)
        return {"success": True, "students": students}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch students: {str(e)}")

@app.get("/classrooms/{classroom_id}/chapters")
async def get_classroom_chapters(classroom_id: str):
    """
    Get all chapters (stories) for a classroom.
    
    Args:
        classroom_id: UUID of the classroom
        
    Returns:
        List of chapter records
    """
    from database.database import get_chapters_by_classroom
    
    try:
        chapters = get_chapters_by_classroom(classroom_id)
        return {"success": True, "chapters": chapters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chapters: {str(e)}")

@app.post("/avatar/create/{student_id}")
async def create_avatar_endpoint(student_id: str):
    """
    Generate an avatar for a student.
    
    Args:
        student_id: UUID of the student
        
    Returns:
        Updated student record with avatar_url
    """
    try:
        student = await generate_avatar(student_id)
        return {"success": True, "student": student}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Avatar generation failed: {str(e)}")
    
@app.post("/story/generate-options")
async def generate_story_options_endpoint(classroom_id: str, lesson_prompt: str):
    """
    Generate 3 story options based on teacher's prompt.
    
    Args:
        classroom_id: UUID of the classroom
        lesson_prompt: Teacher's description of the lesson
        
    Returns:
        List of 3 story options with id, title, summary, theme
    """
    from services.story_idea import generate_story_options
    
    try:
        options = await generate_story_options(classroom_id, lesson_prompt)
        return {"success": True, "options": options}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story generation failed: {str(e)}")


@app.post("/story/create/{classroom_id}")
async def create_story_endpoint(classroom_id: str):
    """
    Create a story for a classroom.
    
    Args:
        classroom_id: UUID of the classroom
        
    Returns:
        Created story record
    """
    try:
        # TODO: Implement story creation logic
        return {"success": True, "message": f"Story creation for classroom {classroom_id} not yet implemented"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story creation failed: {str(e)}")

