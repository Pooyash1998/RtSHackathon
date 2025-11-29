"""
FastAPI main application entry point.
"""
from fastapi import FastAPI, HTTPException, File, UploadFile, Form
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

@app.post("/students/create")
async def create_student(
    classroom_id: str,
    name: str,
    interests: str,
    photo_url: str = None
):
    """
    Create a new student and add them to a classroom.
    
    Args:
        classroom_id: UUID of the classroom to join
        name: Student's full name
        interests: Student's interests/hobbies
        photo_url: Optional URL to student's photo
        
    Returns:
        Created student record
    """
    from database.database import supabase
    
    try:
        # Create student record
        student_data = {
            "classroom_id": classroom_id,
            "name": name,
            "interests": interests,
            "photo_url": photo_url
        }
        
        response = supabase.table("students").insert(student_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create student")
        
        student = response.data[0]
        return {"success": True, "student": student}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")

@app.post("/students/upload-photo")
async def upload_student_photo(
    file: UploadFile = File(...),
    filename: str = Form(...)
):
    """
    Upload a student photo to Supabase storage.
    
    Args:
        file: Photo file upload
        filename: Name of the file
        
    Returns:
        Public URL of the uploaded photo
    """
    from database.database import supabase
    import uuid
    
    try:
        # Read file content
        file_content = await file.read()
        
        # Generate unique filename
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase storage
        response = supabase.storage.from_("StudentPhotos").upload(
            unique_filename,
            file_content,
            {"content-type": file.content_type or f"image/{file_ext}"}
        )
        
        # Get public URL
        public_url = supabase.storage.from_("StudentPhotos").get_public_url(unique_filename)
        
        return {"success": True, "photo_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

@app.get("/students/{student_id}")
async def get_student(student_id: str):
    """
    Get a student by ID.
    
    Args:
        student_id: UUID of the student
        
    Returns:
        Student record
    """
    from database.database import get_student
    
    try:
        student = get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"success": True, "student": student}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch student: {str(e)}")

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

