"""
FastAPI main application entry point.
"""

from fastapi import (
    FastAPI,
    HTTPException,
    File,
    UploadFile,
    Form,
    Query,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from services.avatar import generate_avatar
from services.comic_creation import commit_story_choice
from services.story_idea import start_chapter

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="EduComic API",
    description="API for educational comic generation",
    version="1.0.0",
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
        "supabase_configured": bool(
            os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY")
        ),
    }


@app.post("/classrooms")
async def create_classroom_endpoint(
    name: str = Query(...),
    subject: str = Query(...),
    grade_level: str = Query(...),
    story_theme: str = Query(...),
    design_style: str = Query(...),
):
    """
    Create a new classroom.

    Args:
        name: Classroom name
        subject: Subject being taught
        grade_level: Grade level
        story_theme: Theme for stories
        design_style: Visual design style

    Returns:
        Created classroom record
    """
    from database.database import create_classroom

    try:
        classroom = create_classroom(
            name=name,
            subject=subject,
            grade_level=grade_level,
            story_theme=story_theme,
            design_style=design_style,
            duration="6 months",
        )
        return {"success": True, "classroom": classroom}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create classroom: {str(e)}"
        )


@app.get("/classrooms")
async def get_classrooms():
    """
    Get all classrooms.

    Returns:
        List of all classroom records with student counts
    """
    from database.database import (
        get_all_classrooms,
        get_students_by_classroom,
        get_chapters_by_classroom,
    )

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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch classrooms: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch classroom: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch students: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch chapters: {str(e)}"
        )


@app.post("/students/create")
async def create_student(name: str, interests: str, photo_url: str = None):
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
            "photo_url": photo_url,  # Real photo saved first
        }

        response = supabase.table("students").insert(student_data).execute()

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create student")

        student = response.data[0]
        student_id = student["id"]

        # Step 2: Generate avatar based on the student's photo and interests
        # This will update the avatar_url in the database
        try:
            print(f"Starting avatar generation for student {student_id}")
            student = await generate_avatar(student_id)
            print(f"Avatar generation completed successfully")
        except Exception as e:
            print(f"❌ Avatar generation failed: {e}")
            import traceback

            traceback.print_exc()
            # Continue even if avatar generation fails
            # Student still has their real photo

        return {"success": True, "student": student}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create student: {str(e)}"
        )


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
        get_classroom,
        get_student,
        add_student_to_classroom,
        is_student_in_classroom,
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
                "classroom": classroom,
            }

        # Add student to classroom (many-to-many)
        add_student_to_classroom(student_id, classroom_id)

        return {
            "success": True,
            "message": "Student joined classroom successfully",
            "student": student,
            "classroom": classroom,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to join classroom: {str(e)}"
        )


@app.post("/students/upload-photo")
async def upload_student_photo(file: UploadFile = File(...), filename: str = Form(...)):
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
        allowed_types = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp",
        ]
        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Allowed: {', '.join(allowed_types)}",
            )

        # Read file content
        file_content = await file.read()

        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {len(file_content)} bytes. Max: {max_size} bytes (10MB)",
            )

        # Generate unique filename
        file_ext = filename.split(".")[-1] if "." in filename else "jpg"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"

        print(
            f"Uploading photo: {unique_filename}, size: {len(file_content)} bytes, type: {file.content_type}"
        )

        # Upload to Supabase storage
        try:
            response = supabase.storage.from_("StudentPhotos").upload(
                unique_filename,
                file_content,
                {"content-type": file.content_type or f"image/{file_ext}"},
            )

            # Check for upload errors
            if hasattr(response, "error") and response.error:
                raise Exception(f"Supabase upload error: {response.error}")

        except Exception as upload_error:
            print(f"Upload error: {upload_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Supabase upload failed: {str(upload_error)}. Check storage bucket permissions.",
            )

        # Get public URL
        public_url = supabase.storage.from_("StudentPhotos").get_public_url(
            unique_filename
        )

        print(f"Photo uploaded successfully: {public_url}")

        return {"success": True, "photo_url": public_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to upload photo: {str(e)}")


@app.get("/students")
async def get_all_students():
    """
    Get all students.

    Returns:
        List of all student records
    """
    from database.database import supabase

    try:
        response = (
            supabase.table("students")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
        return {"success": True, "students": response.data}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch students: {str(e)}"
        )


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

        return {"success": True, "student": student, "classrooms": classrooms}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch student: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch classrooms: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Failed to leave classroom: {str(e)}"
        )


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
        raise HTTPException(
            status_code=500, detail=f"Avatar generation failed: {str(e)}"
        )


@app.post("/story/generate-options")
async def generate_story_options_endpoint(
    classroom_id: str = Query(...), lesson_prompt: str = Query(...)
):
    """
    Generate 3 story options based on teacher's prompt.

    Args:
        classroom_id: UUID of the classroom
        lesson_prompt: Teacher's description of the lesson

    Returns:
        List of 3 story options with id, title, summary, theme
    """
    from database.database import get_classroom, get_students_by_classroom
    from services.story_idea import generate_story_ideas

    try:
        # Get classroom and students
        classroom = get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

        students = get_students_by_classroom(classroom_id)

        # Generate story ideas
        story_ideas = generate_story_ideas(classroom, students, lesson_prompt)

        # Format story ideas with IDs
        formatted_options = []
        for idx, idea in enumerate(story_ideas, 1):
            formatted_options.append(
                {
                    "id": f"idea_{idx}",
                    "title": idea.get("title", ""),
                    "summary": idea.get("summary", ""),
                    "theme": classroom.get("story_theme", ""),
                }
            )

        return {"success": True, "options": formatted_options}
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Story generation failed: {str(e)}"
        )


@app.post("/story/generate-thumbnail")
async def generate_thumbnail_endpoint(request: dict):
    """
    Generate a thumbnail image for a story option using Flux.
    This is a temporary image (not stored).

    Request body:
        {
            "title": "Story title",
            "summary": "Story summary"
        }

    Returns:
        Thumbnail URL
    """
    from services.thumbnail import generate_story_thumbnail

    try:
        title = request.get("title", "")
        summary = request.get("summary", "")

        if not title or not summary:
            raise HTTPException(
                status_code=400, detail="Title and summary are required"
            )

        thumbnail_url = await generate_story_thumbnail(title, summary)
        return {"success": True, "thumbnail_url": thumbnail_url}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Thumbnail generation failed: {str(e)}"
        )


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
        return {
            "success": True,
            "message": f"Story creation for classroom {classroom_id} not yet implemented",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Story creation failed: {str(e)}")


# ============================================
# COMIC CREATION ENDPOINTS
# ============================================


class GenerateIdeasRequest(BaseModel):
    classroom_id: str
    teacher_outline: str


class CommitStoryRequest(BaseModel):
    chapter_id: str
    chosen_idea_id: str


@app.post("/chapters/ideas")
async def generate_ideas_endpoint(request: GenerateIdeasRequest):
    """
    Generate 3 story ideas for a new chapter.

    This endpoint:
    1. Fetches classroom and student data
    2. Calls OpenAI to generate 3 story ideas based on teacher's outline
    3. Creates a chapter record with ideas stored in JSON
    4. Returns the chapter ID and ideas for teacher to choose from

    Args:
        request: Contains classroom_id and teacher_outline

    Returns:
        Chapter ID and 3 story ideas
    """
    try:
        result = start_chapter(request.classroom_id, request.teacher_outline)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate ideas: {str(e)}"
        )


@app.post("/chapters/commit")
async def commit_chapter_endpoint(
    request: CommitStoryRequest, background_tasks: BackgroundTasks
):
    """
    Commit a chosen story idea and generate full chapter with comic panels.

    This endpoint starts the generation process in the background and returns immediately.
    The frontend should poll GET /chapters/{chapter_id} to track progress by checking
    the panels array length.

    This endpoint:
    1. Takes a chapter with story ideas (created earlier)
    2. Generates a full script based on the chosen idea (in background)
    3. Creates comic panel images using FLUX (in background)
    4. Stores everything in the database as panels are created

    Args:
        request: Contains chapter_id and chosen_idea_id (e.g., "idea_1")
        background_tasks: FastAPI background task manager

    Returns:
        Immediate success response - use polling to track progress
    """
    from database.database import get_chapter, supabase

    try:
        # Verify chapter exists
        chapter = get_chapter(request.chapter_id)
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")

        # Update status to indicate generation has started
        supabase.table("chapters").update({"status": "generating"}).eq(
            "id", request.chapter_id
        ).execute()

        # Start the actual comic generation in the background
        background_tasks.add_task(
            commit_story_choice, request.chapter_id, request.chosen_idea_id
        )

        return {
            "success": True,
            "message": "Comic generation started",
            "chapter_id": request.chapter_id,
            "status": "generating",
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to start chapter generation: {str(e)}"
        )


@app.get("/classrooms/{classroom_id}/materials")
async def get_classroom_materials(classroom_id: str):
    """
    Get all materials for a classroom.

    Args:
        classroom_id: UUID of the classroom

    Returns:
        List of material records
    """
    from database.database import get_materials_by_classroom

    try:
        materials = get_materials_by_classroom(classroom_id)
        return {"success": True, "materials": materials}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch materials: {str(e)}"
        )


@app.post("/classrooms/{classroom_id}/materials/upload")
async def upload_material(
    classroom_id: str,
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(None),
    week_number: int = Form(None),
):
    """
    Upload a material file for a classroom.

    Args:
        classroom_id: UUID of the classroom
        file: PDF file upload
        title: Title of the material
        description: Optional description
        week_number: Optional week number

    Returns:
        Created material record
    """
    from database.database import supabase, create_material, get_classroom
    import uuid

    try:
        # Verify classroom exists
        classroom = get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

        # Validate file type (PDF only)
        if file.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type: {file.content_type}. Only PDF files are allowed.",
            )

        # Read file content
        file_content = await file.read()

        # Validate file size (max 50MB)
        max_size = 50 * 1024 * 1024  # 50MB
        if len(file_content) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {len(file_content)} bytes. Max: {max_size} bytes (50MB)",
            )

        # Generate unique filename
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
        unique_filename = f"{classroom_id}/{uuid.uuid4()}.{file_ext}"

        print(f"Uploading material: {unique_filename}, size: {len(file_content)} bytes")

        # Upload to Supabase storage in Materials bucket
        try:
            storage_response = supabase.storage.from_("Materials").upload(
                unique_filename,
                file_content,
                {
                    "content-type": file.content_type or "application/pdf",
                    "cache-control": "3600",
                },
            )

            # Check for upload errors
            if hasattr(storage_response, "error") and storage_response.error:
                raise Exception(f"Supabase upload error: {storage_response.error}")

        except Exception as upload_error:
            print(f"Upload error: {upload_error}")
            raise HTTPException(
                status_code=500,
                detail=f"Supabase upload failed: {str(upload_error)}. Check storage bucket permissions.",
            )

        # Get public URL
        public_url = supabase.storage.from_("Materials").get_public_url(unique_filename)

        print(f"Material uploaded successfully: {public_url}")

        # Create material record in database
        material = create_material(
            classroom_id=classroom_id,
            title=title,
            file_url=public_url,
            file_type=file.content_type,
            description=description,
            week_number=week_number,
        )

        return {"success": True, "material": material}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to upload material: {str(e)}"
        )


@app.delete("/materials/{material_id}")
async def delete_material_endpoint(material_id: str):
    """
    Delete a material.

    Args:
        material_id: UUID of the material

    Returns:
        Success message
    """
    from database.database import delete_material, get_material, supabase

    try:
        # Get material to find file URL
        material = get_material(material_id)
        if not material:
            raise HTTPException(status_code=404, detail="Material not found")

        # Extract filename from URL and delete from storage
        try:
            file_url = material.get("file_url", "")
            # Extract path from URL (after /Materials/)
            if "/Materials/" in file_url:
                file_path = file_url.split("/Materials/")[-1]
                supabase.storage.from_("Materials").remove([file_path])
                print(f"Deleted file from storage: {file_path}")
        except Exception as storage_error:
            print(f"Failed to delete file from storage: {storage_error}")
            # Continue with database deletion even if storage deletion fails

        # Delete from database
        success = delete_material(material_id)
        if not success:
            raise HTTPException(status_code=404, detail="Material not found")

        return {"success": True, "message": "Material deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete material: {str(e)}"
        )


@app.post("/classrooms/{classroom_id}/chapters/start")
async def start_chapter_endpoint(classroom_id: str, lesson_prompt: str = Query(...)):
    """
    Start a new chapter by generating story options.

    Args:
        classroom_id: UUID of the classroom
        lesson_prompt: Teacher's lesson description

    Returns:
        Created chapter with story options
    """
    from database.database import (
        get_chapters_by_classroom,
        get_classroom,
        get_students_by_classroom,
        supabase,
    )
    from services.story_idea import generate_story_ideas

    try:
        # Get classroom and students
        classroom = get_classroom(classroom_id)
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

        students = get_students_by_classroom(classroom_id)

        # Get next chapter index - use max index + 1 to handle gaps
        existing_chapters = get_chapters_by_classroom(classroom_id)
        if existing_chapters:
            next_index = max(ch.get("index", 0) for ch in existing_chapters) + 1
        else:
            next_index = 1

        # Generate story ideas
        story_ideas = generate_story_ideas(classroom, students, lesson_prompt)

        # Format story ideas with IDs
        formatted_ideas = []
        for idx, idea in enumerate(story_ideas, 1):
            formatted_ideas.append(
                {
                    "id": f"idea_{idx}",
                    "title": idea.get("title", ""),
                    "summary": idea.get("summary", ""),
                    "theme": classroom.get("story_theme", ""),
                }
            )

        # Create chapter directly with correct schema
        data = {
            "classroom_id": classroom_id,
            "index": next_index,
            "original_prompt": lesson_prompt,
            "story_ideas": formatted_ideas,
            "status": "options_generated",
        }

        response = supabase.table("chapters").insert(data).execute()
        chapter = response.data[0] if response.data else None

        return {"success": True, "chapter": chapter}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to start chapter: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(
            status_code=500, detail=f"Failed to start chapter: {str(e)}"
        )


@app.post("/chapters/{chapter_id}/choose-idea")
async def choose_story_idea(chapter_id: str, idea_id: str, thumbnail_url: str = None):
    """
    Teacher chooses a story idea for the chapter.
    Downloads the thumbnail from Flux and uploads it to Supabase storage.

    Args:
        chapter_id: UUID of the chapter
        idea_id: ID of the chosen story idea
        thumbnail_url: URL of the thumbnail from Flux (optional)

    Returns:
        Updated chapter
    """
    from database.database import supabase, get_chapter
    import httpx
    import uuid

    try:
        # Verify chapter exists
        chapter = get_chapter(chapter_id)
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")

        stored_thumbnail_url = None

        # If thumbnail URL provided, download and upload to Supabase
        if thumbnail_url:
            try:
                print(f"Downloading thumbnail from: {thumbnail_url}")

                # Download the image from Flux
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.get(thumbnail_url)
                    if response.status_code == 200:
                        image_data = response.content

                        # Generate unique filename
                        filename = f"{chapter_id}/{uuid.uuid4()}.jpeg"

                        print(f"Uploading thumbnail to Supabase: {filename}")

                        # Upload to Supabase Thumbnails bucket
                        upload_response = supabase.storage.from_("Thumbnails").upload(
                            filename, image_data, {"content-type": "image/jpeg"}
                        )

                        # Get public URL
                        stored_thumbnail_url = supabase.storage.from_(
                            "Thumbnails"
                        ).get_public_url(filename)
                        print(
                            f"✅ Thumbnail uploaded successfully: {stored_thumbnail_url}"
                        )
                    else:
                        print(f"⚠️ Failed to download thumbnail: {response.status_code}")

            except Exception as e:
                print(f"⚠️ Failed to save thumbnail: {e}")
                import traceback

                traceback.print_exc()
                # Continue even if thumbnail upload fails

        # Update chapter with chosen idea and thumbnail
        update_data = {"chosen_idea_id": idea_id, "status": "idea_chosen"}

        if stored_thumbnail_url:
            update_data["thumbnail_url"] = stored_thumbnail_url

        response = (
            supabase.table("chapters")
            .update(update_data)
            .eq("id", chapter_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update chapter")

        return {"success": True, "chapter": response.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Failed to choose idea: {e}")
        import traceback

        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to choose idea: {str(e)}")


@app.get("/chapters/{chapter_id}")
async def get_chapter_with_panels_endpoint(chapter_id: str):
    """
    Get a chapter with all its panels.

    Args:
        chapter_id: UUID of the chapter

    Returns:
        Chapter record with nested panels array
    """
    from database.database import get_chapter_with_panels

    try:
        chapter = get_chapter_with_panels(chapter_id)
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")

        return {"success": True, "chapter": chapter}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch chapter: {str(e)}"
        )


@app.delete("/chapters/{chapter_id}")
async def delete_chapter_endpoint(chapter_id: str):
    """
    Delete a chapter and all its panels.

    Args:
        chapter_id: UUID of the chapter to delete

    Returns:
        Success message
    """
    from database.database import delete_chapter, get_chapter

    try:
        # Verify chapter exists
        chapter = get_chapter(chapter_id)
        if not chapter:
            raise HTTPException(status_code=404, detail="Chapter not found")

        # Delete the chapter (cascades to panels)
        success = delete_chapter(chapter_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete chapter")

        return {"success": True, "message": "Chapter deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to delete chapter: {str(e)}"
        )


@app.get("/students/{student_id}/chapters")
async def get_student_chapters(student_id: str):
    """
    Get all chapters across all classrooms a student is enrolled in.

    Args:
        student_id: UUID of the student

    Returns:
        List of chapter records with classroom info
    """
    from database.database import (
        get_classrooms_by_student,
        get_chapters_by_classroom,
        get_classroom,
    )

    try:
        # Get all classrooms the student is enrolled in
        classrooms = get_classrooms_by_student(student_id)

        # Collect all chapters from all classrooms
        all_chapters = []
        for classroom in classrooms:
            chapters = get_chapters_by_classroom(classroom["id"])
            # Add classroom info to each chapter
            for chapter in chapters:
                chapter["classroom_name"] = classroom["name"]
                chapter["classroom_subject"] = classroom.get("subject", "")
                all_chapters.append(chapter)

        # Sort by created_at descending (newest first)
        all_chapters.sort(key=lambda x: x.get("created_at", ""), reverse=True)

        return {"success": True, "chapters": all_chapters}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to fetch student chapters: {str(e)}"
        )
