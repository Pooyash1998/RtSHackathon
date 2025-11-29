"""
Database connection and repository functions for Supabase.
"""
from supabase import create_client, Client
import os
from typing import List, Optional, Dict, Any

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# ============================================
# CLASSROOM OPERATIONS
# ============================================

async def insert_classroom(classroom_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new classroom record."""
    response = supabase.table("classrooms").insert(classroom_data).execute()
    return response.data[0]


async def get_classroom(classroom_id: str) -> Optional[Dict[str, Any]]:
    """Get classroom by ID."""
    response = supabase.table("classrooms").select("*").eq("id", classroom_id).execute()
    return response.data[0] if response.data else None


async def list_classrooms() -> List[Dict[str, Any]]:
    """Get all classrooms."""
    response = supabase.table("classrooms").select("*").order("created_at", desc=True).execute()
    return response.data


# ============================================
# STUDENT OPERATIONS
# ============================================

async def insert_student(student_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new student record."""
    response = supabase.table("students").insert(student_data).execute()
    return response.data[0]


async def get_student(student_id: str) -> Optional[Dict[str, Any]]:
    """Get student by ID."""
    response = supabase.table("students").select("*").eq("id", student_id).execute()
    return response.data[0] if response.data else None


async def update_student(student_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update student record."""
    response = supabase.table("students").update(updates).eq("id", student_id).execute()
    return response.data[0]


async def get_students_by_classroom(classroom_id: str) -> List[Dict[str, Any]]:
    """Get all students in a classroom."""
    response = supabase.table("students").select("*").eq("classroom_id", classroom_id).order("created_at").execute()
    return response.data


# ============================================
# STORY OPERATIONS
# ============================================

async def insert_story(story_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new story record."""
    response = supabase.table("stories").insert(story_data).execute()
    return response.data[0]


async def get_story(story_id: str) -> Optional[Dict[str, Any]]:
    """Get story by ID."""
    response = supabase.table("stories").select("*").eq("id", story_id).execute()
    return response.data[0] if response.data else None


async def update_story(story_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update story record."""
    response = supabase.table("stories").update(updates).eq("id", story_id).execute()
    return response.data[0]


async def get_stories_by_classroom(classroom_id: str) -> List[Dict[str, Any]]:
    """Get all stories for a classroom."""
    response = supabase.table("stories").select("*").eq("classroom_id", classroom_id).order("created_at", desc=True).execute()
    return response.data


# ============================================
# PANEL OPERATIONS
# ============================================

async def insert_panels(panels_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Create multiple panel records."""
    response = supabase.table("panels").insert(panels_data).execute()
    return response.data


async def get_panels_by_story(story_id: str) -> List[Dict[str, Any]]:
    """Get all panels for a story, sorted by panel_number."""
    response = supabase.table("panels").select("*").eq("story_id", story_id).order("panel_number").execute()
    return response.data


async def update_panel(panel_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    """Update a panel record."""
    response = supabase.table("panels").update(updates).eq("id", panel_id).execute()
    return response.data[0]


async def get_panel_by_story_and_number(story_id: str, panel_number: int) -> Optional[Dict[str, Any]]:
    """Get a specific panel by story ID and panel number."""
    response = supabase.table("panels").select("*").eq("story_id", story_id).eq("panel_number", panel_number).execute()
    return response.data[0] if response.data else None


# ============================================
# COMBINED QUERIES
# ============================================

async def get_story_with_panels(story_id: str) -> Optional[Dict[str, Any]]:
    """Get story with all its panels."""
    story = await get_story(story_id)
    if not story:
        return None
    
    panels = await get_panels_by_story(story_id)
    
    return {
        "story": story,
        "panels": panels
    }


async def get_story_with_panels_and_students(story_id: str) -> Optional[Dict[str, Any]]:
    """Get story with panels and classroom students."""
    story = await get_story(story_id)
    if not story:
        return None
    
    panels = await get_panels_by_story(story_id)
    students = await get_students_by_classroom(story["classroom_id"])
    
    return {
        "story": story,
        "panels": panels,
        "students": students
    }


# ============================================
# STORAGE OPERATIONS (for images)
# ============================================

def upload_file_to_storage(bucket: str, file_path: str, file_data: bytes) -> str:
    """Upload file to Supabase storage and return public URL."""
    response = supabase.storage.from_(bucket).upload(file_path, file_data)
    
    # Get public URL
    public_url = supabase.storage.from_(bucket).get_public_url(file_path)
    return public_url


def delete_file_from_storage(bucket: str, file_path: str) -> None:
    """Delete file from Supabase storage."""
    supabase.storage.from_(bucket).remove([file_path])
