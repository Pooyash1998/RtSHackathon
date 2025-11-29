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
    name: str,
    interests: str,
    photo_url: str = None
):
    """
    Create a new student account (without classroom).
    Photo must be uploaded first, then this endpoint creates the student
    and generates their avatar.
    
    Args:
        name: Student's full name
        interests: Student's interests/hobbies
        photo_url: URL to student's photo (should be uploaded first)
        
    Returns:
        Created student record with generated avatar
    """
    from database.database import supabase
    from services.avatar import generate_avatar
    
    try:
        # Step 1: Create student record with photo_url (no classroom_id)
        student_data = {
            "name": name,
            "interests": interests,
            "photo_url": photo_url  # Real photo saved first
        }
        
        response = supabase.table("students").insert(student_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create student")
        
        student = response.data[0]
        student_id = student["id"]
        
        # Step 2: Generate avatar based on the student's photo and interests
        # This will update the avatar_url in the database
        try:
            student = await generate_avatar(student_id)
        except Exception as e:
            print(f"Avatar generation failed: {e}")
            # Continue even if avatar generation fails
            # Student still has their real photo
        
        return {"success": True, "student": student}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")

@app.post("/students/{student_id}/join-classroom/{classroom_id}")
async def join_classroom(student_id: str, classroom_id: str):
    """
    Add a student to a classroom (many-to-many).
    Student can be in multiple classrooms.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom to join
        
    Returns:
        Student and classroom info
    """
    from database.database import (
        get_classroom, get_student, 
        add_student_to_classroom, is_student_in_classroom
    )
    
    try:
        # Verify classroom exists
        classroom = get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        # Verify student exists
        student = get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Check if already enrolled
        if is_student_in_classroom(student_id, classroom_id):
            return {
                "success": True, 
                "message": "Student already enrolled in this classroom",
                "student": student, 
                "classroom": classroom
            }
        
        # Add student to classroom (many-to-many)
        add_student_to_classroom(student_id, classroom_id)
        
        return {
            "success": True, 
            "message": "Student joined classroom successfully",
            "student": student, 
            "classroom": classroom
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to join classroom: {str(e)}")

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
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(allowed_types)}"
            )
        
        # Read file content
        file_content = await file.read()
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {len(file_content)} bytes. Max: {max_size} bytes (10MB)"
            )
        
        # Generate unique filename
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        print(f"Uploading photo: {unique_filename}, size: {len(file_content)} bytes, type: {file.content_type}")
        
        # Upload to Supabase storage
        try:
            response = supabase.storage.from_("StudentPhotos").upload(
                unique_filename,
                file_content,
                {"content-type": file.content_type or f"image/{file_ext}"}
            )
            
            # Check for upload errors
            if hasattr(response, 'error') and response.error:
                raise Exception(f"Supabase upload error: {response.error}")
                
        except Exception as upload_error:
            print(f"Upload error: {upload_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Supabase upload failed: {str(upload_error)}. Check storage bucket permissions."
            )
        
        # Get public URL
        public_url = supabase.storage.from_("StudentPhotos").get_public_url(unique_filename)
        
        print(f"Photo uploaded successfully: {public_url}")
        
        return {"success": True, "photo_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")

@app.get("/students/{student_id}")
async def get_student(student_id: str):
    """
    Get a student by ID with all their classrooms.
    
    Args:
        student_id: UUID of the student
        
    Returns:
        Student record with list of classrooms
    """
    from database.database import get_student, get_classrooms_by_student
    
    try:
        student = get_student(student_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student not found")
        
        # Get all classrooms the student is enrolled in
        classrooms = get_classrooms_by_student(student_id)
        
        return {
            "success": True, 
            "student": student, 
            "classrooms": classrooms
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch student: {str(e)}")

@app.get("/students/{student_id}/classrooms")
async def get_student_classrooms(student_id: str):
    """
    Get all classrooms a student is enrolled in.
    
    Args:
        student_id: UUID of the student
        
    Returns:
        List of classroom records
    """
    from database.database import get_classrooms_by_student
    
    try:
        classrooms = get_classrooms_by_student(student_id)
        return {"success": True, "classrooms": classrooms}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch classrooms: {str(e)}")

@app.delete("/students/{student_id}/leave-classroom/{classroom_id}")
async def leave_classroom(student_id: str, classroom_id: str):
    """
    Remove a student from a classroom.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom to leave
        
    Returns:
        Success message
    """
    from database.database import remove_student_from_classroom
    
    try:
        success = remove_student_from_classroom(student_id, classroom_id)
        if not success:
            raise HTTPException(status_code=404, detail="Enrollment not found")
        
        return {"success": True, "message": "Student left classroom successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to leave classroom: {str(e)}")

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

