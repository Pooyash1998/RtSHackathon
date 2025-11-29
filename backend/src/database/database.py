"""
Database module for Supabase operations.
Provides get and create functions for all tables.
"""

import os
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env file")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ============================================
# CLASSROOM FUNCTIONS
# ============================================


def get_classroom(classroom_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a classroom by ID.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        Classroom record or None if not found
    """
    response = supabase.table("classrooms").select("*").eq("id", classroom_id).execute()
    return response.data[0] if response.data else None


def get_all_classrooms() -> List[Dict[str, Any]]:
    """
    Get all classrooms.
    
    Returns:
        List of all classroom records
    """
    response = supabase.table("classrooms").select("*").order("created_at", desc=True).execute()
    return response.data


# ============================================
# STUDENT FUNCTIONS
# ============================================


def get_student(student_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a student by ID.
    
    Args:
        student_id: UUID of the student
    
    Returns:
        Student record or None if not found
    """
    response = supabase.table("students").select("*").eq("id", student_id).execute()
    return response.data[0] if response.data else None


def get_students_by_classroom(classroom_id: str) -> List[Dict[str, Any]]:
    """
    Get all students in a classroom (using many-to-many relationship) (using many-to-many relationship).
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        List of student records
    """
    # Query through junction table
    response = supabase.table("student_classrooms").select(
        "students(*)"
    ).eq("classroom_id", classroom_id).execute()
    
    # Extract student data from nested structure
    students = [item["students"] for item in response.data if item.get("students")]
    return students


def update_student(student_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Update a student record.
    
    Args:
        student_id: UUID of the student
        updates: Dictionary of fields to update
    
    Returns:
        Updated student record or None if not found
    """
    response = supabase.table("students").update(updates).eq("id", student_id).execute()
    return response.data[0] if response.data else None


# ============================================
# CHAPTER FUNCTIONS
# ============================================

def create_chapter(
    classroom_id: str,
    index: int,
    original_prompt: str,
    story_ideas: Optional[List[Dict[str, Any]]] = None,
    status: str = "draft"
) -> Dict[str, Any]:
    """
    Create a new chapter in a classroom story.
    
    Args:
        classroom_id: UUID of the classroom
        index: Chapter number (starting from 1)
        original_prompt: Teacher's original prompt/outline for the chapter
        story_ideas: Optional list of AI-generated story ideas
        status: Chapter status (draft, awaiting_choice, generating, ready)
    
    Returns:
        Created chapter record
    """
    data = {
        "classroom_id": classroom_id,
        "index": index,
        "original_prompt": original_prompt,
        "status": status
    }
    
    if story_ideas is not None:
        data["story_ideas"] = story_ideas
    
    response = supabase.table("chapters").insert(data).execute()
    return response.data[0] if response.data else None


def get_chapter(chapter_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a chapter by ID.
    
    Args:
        chapter_id: UUID of the chapter
    
    Returns:
        Chapter record or None if not found
    """
    response = supabase.table("chapters").select("*").eq("id", chapter_id).execute()
    return response.data[0] if response.data else None


def update_chapter(
    chapter_id: str,
    updates: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Update a chapter record.
    
    Args:
        chapter_id: UUID of the chapter
        updates: Dictionary of fields to update (story_ideas, chosen_idea_id, story_script, status, etc.)
    
    Returns:
        Updated chapter record or None if not found
    """
    response = supabase.table("chapters").update(updates).eq("id", chapter_id).execute()
    return response.data[0] if response.data else None


def get_chapters_by_classroom(classroom_id: str) -> List[Dict[str, Any]]:
    """
    Get all chapters for a classroom, ordered by index.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        List of chapter records ordered by index
    """
    response = supabase.table("chapters").select("*").eq("classroom_id", classroom_id).order("index").execute()
    return response.data


# ============================================
# PANEL FUNCTIONS
# ============================================

def create_panel(
    chapter_id: str,
    index: int,
    image: str
) -> Dict[str, Any]:
    """
    Create a new panel in a chapter.
    
    Args:
        chapter_id: UUID of the chapter
        index: Panel number within the chapter (starting from 1)
        image: URL of the panel image
    
    Returns:
        Created panel record
    """
    data = {
        "chapter_id": chapter_id,
        "index": index,
        "image": image
    }
    
    response = supabase.table("panels").insert(data).execute()
    return response.data[0] if response.data else None


def get_panel(panel_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a panel by ID.
    
    Args:
        panel_id: UUID of the panel
    
    Returns:
        Panel record or None if not found
    """
    response = supabase.table("panels").select("*").eq("id", panel_id).execute()
    return response.data[0] if response.data else None


def get_panels_by_chapter(chapter_id: str) -> List[Dict[str, Any]]:
    """
    Get all panels for a chapter, ordered by index.
    
    Args:
        chapter_id: UUID of the chapter
    
    Returns:
        List of panel records ordered by index
    """
    response = supabase.table("panels").select("*").eq("chapter_id", chapter_id).order("index").execute()
    return response.data


# ============================================
# STUDENT-CLASSROOM RELATIONSHIP FUNCTIONS
# ============================================

def add_student_to_classroom(student_id: str, classroom_id: str) -> Dict[str, Any]:
    """
    Add a student to a classroom (many-to-many).
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        Created relationship record
    """
    data = {
        "student_id": student_id,
        "classroom_id": classroom_id
    }
    
    response = supabase.table("student_classrooms").insert(data).execute()
    return response.data[0] if response.data else None


def remove_student_from_classroom(student_id: str, classroom_id: str) -> bool:
    """
    Remove a student from a classroom.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        True if successful
    """
    response = supabase.table("student_classrooms").delete().eq(
        "student_id", student_id
    ).eq("classroom_id", classroom_id).execute()
    return len(response.data) > 0


def get_classrooms_by_student(student_id: str) -> List[Dict[str, Any]]:
    """
    Get all classrooms a student is enrolled in.
    
    Args:
        student_id: UUID of the student
    
    Returns:
        List of classroom records
    """
    response = supabase.table("student_classrooms").select(
        "classrooms(*)"
    ).eq("student_id", student_id).execute()
    
    # Extract classroom data from nested structure
    classrooms = [item["classrooms"] for item in response.data if item.get("classrooms")]
    return classrooms


def is_student_in_classroom(student_id: str, classroom_id: str) -> bool:
    """
    Check if a student is enrolled in a classroom.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        True if student is in classroom
    """
    response = supabase.table("student_classrooms").select("id").eq(
        "student_id", student_id
    ).eq("classroom_id", classroom_id).execute()
    return len(response.data) > 0


# ============================================
# STUDENT-CLASSROOM RELATIONSHIP FUNCTIONS
# ============================================

def add_student_to_classroom(student_id: str, classroom_id: str) -> Dict[str, Any]:
    """
    Add a student to a classroom (many-to-many).
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        Created relationship record
    """
    data = {
        "student_id": student_id,
        "classroom_id": classroom_id
    }
    
    response = supabase.table("student_classrooms").insert(data).execute()
    return response.data[0] if response.data else None


def remove_student_from_classroom(student_id: str, classroom_id: str) -> bool:
    """
    Remove a student from a classroom.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        True if successful
    """
    response = supabase.table("student_classrooms").delete().eq(
        "student_id", student_id
    ).eq("classroom_id", classroom_id).execute()
    return len(response.data) > 0


def get_classrooms_by_student(student_id: str) -> List[Dict[str, Any]]:
    """
    Get all classrooms a student is enrolled in.
    
    Args:
        student_id: UUID of the student
    
    Returns:
        List of classroom records
    """
    response = supabase.table("student_classrooms").select(
        "classrooms(*)"
    ).eq("student_id", student_id).execute()
    
    # Extract classroom data from nested structure
    classrooms = [item["classrooms"] for item in response.data if item.get("classrooms")]
    return classrooms


def is_student_in_classroom(student_id: str, classroom_id: str) -> bool:
    """
    Check if a student is enrolled in a classroom.
    
    Args:
        student_id: UUID of the student
        classroom_id: UUID of the classroom
    
    Returns:
        True if student is in classroom
    """
    response = supabase.table("student_classrooms").select("id").eq(
        "student_id", student_id
    ).eq("classroom_id", classroom_id).execute()
    return len(response.data) > 0


# ============================================
# UTILITY FUNCTIONS
# ============================================

def delete_classroom(classroom_id: str) -> bool:
    """
    Delete a classroom (cascades to students, chapters, and panels).
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        True if successful
    """
    response = supabase.table("classrooms").delete().eq("id", classroom_id).execute()
    return len(response.data) > 0


def delete_student(student_id: str) -> bool:
    """
    Delete a student.
    
    Args:
        student_id: UUID of the student
    
    Returns:
        True if successful
    """
    response = supabase.table("students").delete().eq("id", student_id).execute()
    return len(response.data) > 0


def delete_chapter(chapter_id: str) -> bool:
    """
    Delete a chapter (cascades to panels).
    
    Args:
        chapter_id: UUID of the chapter
    
    Returns:
        True if successful
    """
    response = supabase.table("chapters").delete().eq("id", chapter_id).execute()
    return len(response.data) > 0


def delete_panel(panel_id: str) -> bool:
    """
    Delete a panel.
    
    Args:
        panel_id: UUID of the panel
    
    Returns:
        True if successful
    """
    response = supabase.table("panels").delete().eq("id", panel_id).execute()
    return len(response.data) > 0

# ============================================
# ADVANCED QUERY FUNCTIONS
# ============================================

def get_classroom_with_students(classroom_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a classroom with all its students.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        Classroom record with nested students array
    """
    classroom = get_classroom(classroom_id)
    if classroom:
        classroom["students"] = get_students_by_classroom(classroom_id)
    return classroom


def get_chapter_with_panels(chapter_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a chapter with all its panels.
    
    Args:
        chapter_id: UUID of the chapter
    
    Returns:
        Chapter record with nested panels array
    """
    chapter = get_chapter(chapter_id)
    if chapter:
        chapter["panels"] = get_panels_by_chapter(chapter_id)
    return chapter


def get_classroom_full_story(classroom_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a classroom with all chapters and their panels.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        Classroom record with nested chapters (each with panels) and students
    """
    classroom = get_classroom(classroom_id)
    if not classroom:
        return None
    
    # Get students
    classroom["students"] = get_students_by_classroom(classroom_id)
    
    # Get chapters with panels
    chapters = get_chapters_by_classroom(classroom_id)
    for chapter in chapters:
        chapter["panels"] = get_panels_by_chapter(chapter["id"])
    
    classroom["chapters"] = chapters
    return classroom


# ============================================
# MATERIAL FUNCTIONS
# ============================================

def create_material(
    classroom_id: str,
    title: str,
    file_url: str,
    file_type: str,
    description: Optional[str] = None,
    week_number: Optional[int] = None
) -> Dict[str, Any]:
    """
    Create a new material for a classroom.
    
    Args:
        classroom_id: UUID of the classroom
        title: Title of the material
        file_url: URL to the uploaded file
        file_type: Type of file (e.g., 'application/pdf')
        description: Optional description
        week_number: Optional week number
    
    Returns:
        Created material record
    """
    data = {
        "classroom_id": classroom_id,
        "title": title,
        "file_url": file_url,
        "file_type": file_type,
        "description": description,
        "week_number": week_number
    }
    
    response = supabase.table("materials").insert(data).execute()
    return response.data[0] if response.data else None


def get_materials_by_classroom(classroom_id: str) -> List[Dict[str, Any]]:
    """
    Get all materials for a classroom, ordered by creation date.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        List of material records ordered by created_at (newest first)
    """
    response = supabase.table("materials").select("*").eq(
        "classroom_id", classroom_id
    ).order("created_at", desc=True).execute()
    return response.data


def get_material(material_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a material by ID.
    
    Args:
        material_id: UUID of the material
    
    Returns:
        Material record or None if not found
    """
    response = supabase.table("materials").select("*").eq("id", material_id).execute()
    return response.data[0] if response.data else None


def delete_material(material_id: str) -> bool:
    """
    Delete a material.
    
    Args:
        material_id: UUID of the material
    
    Returns:
        True if successful
    """
    response = supabase.table("materials").delete().eq("id", material_id).execute()
    return len(response.data) > 0
