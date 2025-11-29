"""
FastAPI main application entry point.
"""
from fastapi import FastAPI, HTTPException
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
        raise HTTPException(status_code=500, detail=f"Failed to generate ideas: {str(e)}")


@app.post("/chapters/commit")
async def commit_chapter_endpoint(request: CommitStoryRequest):
    """
    Commit a chosen story idea and generate full chapter with comic panels.
    
    This endpoint:
    1. Takes a chapter with story ideas (created earlier)
    2. Generates a full script based on the chosen idea
    3. Creates comic panel images using FLUX
    4. Stores everything in the database
    
    Args:
        request: Contains chapter_id and chosen_idea_id (e.g., "idea_1")
        
    Returns:
        Full chapter with panels and generated images
    """
    try:
        result = commit_story_choice(request.chapter_id, request.chosen_idea_id)
        return {"success": True, "data": result}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chapter commit failed: {str(e)}")

