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

def create_classroom(
    name: str,
    subject: str,
    grade_level: str,
    story_theme: str,
    design_style: str,
    duration: str
) -> Dict[str, Any]:
    """
    Create a new classroom.
    
    Args:
        name: Classroom name
        subject: Subject being taught
        grade_level: Grade level of students
        story_theme: Theme for the story
        design_style: Visual style ('manga' or 'comic')
        duration: Duration of the classroom
    
    Returns:
        Created classroom record
    """
    data = {
        "name": name,
        "subject": subject,
        "grade_level": grade_level,
        "story_theme": story_theme,
        "design_style": design_style,
        "duration": duration
    }
    
    response = supabase.table("classrooms").insert(data).execute()
    return response.data[0] if response.data else None


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

def create_student(
    classroom_id: str,
    name: str,
    interests: str,
    avatar_url: Optional[str] = None,
    photo_url: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a new student in a classroom.
    
    Args:
        classroom_id: UUID of the classroom
        name: Student name
        interests: Student interests
        avatar_url: URL of generated avatar (optional)
        photo_url: URL of uploaded photo (optional)
    
    Returns:
        Created student record
    """
    data = {
        "classroom_id": classroom_id,
        "name": name,
        "interests": interests,
        "avatar_url": avatar_url,
        "photo_url": photo_url
    }
    
    response = supabase.table("students").insert(data).execute()
    return response.data[0] if response.data else None


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
    Get all students in a classroom.
    
    Args:
        classroom_id: UUID of the classroom
    
    Returns:
        List of student records
    """
    response = supabase.table("students").select("*").eq("classroom_id", classroom_id).order("created_at").execute()
    return response.data


# ============================================
# CHAPTER FUNCTIONS
# ============================================

def create_chapter(
    classroom_id: str,
    index: int,
    chapter_outline: str
) -> Dict[str, Any]:
    """
    Create a new chapter in a classroom story.
    
    Args:
        classroom_id: UUID of the classroom
        index: Chapter number (starting from 1)
        chapter_outline: Outline/description of the chapter
    
    Returns:
        Created chapter record
    """
    data = {
        "classroom_id": classroom_id,
        "index": index,
        "chapter_outline": chapter_outline
    }
    
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
