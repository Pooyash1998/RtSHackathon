"""
Story idea generation service using OpenAI.
Generates 3 story options based on teacher's prompt and classroom context.
"""
import os
import json
from typing import List, Dict, Any
from openai import AsyncOpenAI
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from database.database import get_classroom, get_students_by_classroom

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))


async def generate_story_options(
    classroom_id: str,
    lesson_prompt: str
) -> List[Dict[str, Any]]:
    """
    Generate 3 story options based on the teacher's lesson prompt.
    
    Args:
        classroom_id: UUID of the classroom
        lesson_prompt: Teacher's description of what they want the story about
        
    Returns:
        List of 3 story option dictionaries with id, title, summary, theme
        
    Raises:
        ValueError: If classroom not found or API key not configured
        Exception: If OpenAI API call fails
    """
    # Get classroom context
    classroom = get_classroom(classroom_id)
    if not classroom:
        raise ValueError(f"Classroom with ID {classroom_id} not found")
    
    # Get students for context
    students = get_students_by_classroom(classroom_id)
    
    # Get API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured in environment")
    
    # Build prompt for OpenAI
    prompt = _build_story_options_prompt(classroom, students, lesson_prompt)
    
    # Call OpenAI API
    story_options = await _call_openai_for_options(prompt)
    
    return story_options


def _build_story_options_prompt(
    classroom: Dict[str, Any],
    students: List[Dict[str, Any]],
    lesson_prompt: str
) -> str:
    """
    Build a prompt for OpenAI to generate story options.
    
    Args:
        classroom: Classroom data dictionary
        students: List of student data dictionaries
        lesson_prompt: Teacher's lesson description
        
    Returns:
        Formatted prompt string
    """
    # Extract classroom info
    subject = classroom.get("subject", "")
    grade_level = classroom.get("grade_level", "")
    story_theme = classroom.get("story_theme", "")
    design_style = classroom.get("design_style", "manga")
    
    # Build student context
    student_names = [s.get("name", "") for s in students]
    student_interests = [s.get("interests", "") for s in students]
    
    student_context = ""
    if student_names:
        student_context = f"\n\nStudents in the class:\n"
        for i, (name, interests) in enumerate(zip(student_names, student_interests), 1):
            student_context += f"{i}. {name} - Interests: {interests}\n"
    
    prompt = f"""You are a creative educational comic writer. Generate 3 different story concepts for a classroom comic.

CLASSROOM CONTEXT:
- Subject: {subject}
- Grade Level: {grade_level}
- Story Theme: {story_theme}
- Art Style: {design_style}
{student_context}

LESSON CONTENT:
{lesson_prompt}

TASK:
Generate exactly 3 distinct story concepts that:
1. Incorporate the lesson content in an engaging way
2. Feature the students as main characters
3. Match the story theme ({story_theme})
4. Are age-appropriate for grade {grade_level}
5. Make learning fun and memorable

For each story concept, provide:
- title: A catchy, engaging title (max 60 characters)
- summary: A brief 2-3 sentence summary of the story plot
- theme: The primary theme/setting (e.g., "space adventure", "mystery detective", "time travel")

Return ONLY a valid JSON array with exactly 3 objects, no additional text:
[
  {{
    "title": "Story Title 1",
    "summary": "Brief summary of the first story concept...",
    "theme": "primary theme"
  }},
  {{
    "title": "Story Title 2", 
    "summary": "Brief summary of the second story concept...",
    "theme": "primary theme"
  }},
  {{
    "title": "Story Title 3",
    "summary": "Brief summary of the third story concept...",
    "theme": "primary theme"
  }}
]"""
    
    return prompt


async def _call_openai_for_options(prompt: str) -> List[Dict[str, Any]]:
    """
    Call OpenAI API to generate story options.
    
    Args:
        prompt: The formatted prompt
        
    Returns:
        List of 3 story option dictionaries
        
    Raises:
        Exception: If API call fails or response is invalid
    """
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini for cost efficiency
            messages=[
                {
                    "role": "system",
                    "content": "You are a creative educational comic writer. You always respond with valid JSON only, no additional text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.8,  # Higher temperature for more creative options
            max_tokens=1000,
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        # Parse the response
        content = response.choices[0].message.content
        
        # Try to parse as JSON
        try:
            # If response_format json_object wraps it, extract the array
            parsed = json.loads(content)
            
            # Handle different response formats
            if isinstance(parsed, list):
                story_options = parsed
            elif isinstance(parsed, dict) and "stories" in parsed:
                story_options = parsed["stories"]
            elif isinstance(parsed, dict) and "options" in parsed:
                story_options = parsed["options"]
            else:
                # Assume the dict itself contains the stories
                story_options = [parsed]
        except json.JSONDecodeError:
            raise ValueError(f"Failed to parse OpenAI response as JSON: {content}")
        
        # Validate we have exactly 3 options
        if len(story_options) < 3:
            raise ValueError(f"Expected 3 story options, got {len(story_options)}")
        
        # Take only first 3 if more were generated
        story_options = story_options[:3]
        
        # Add unique IDs to each option
        import uuid
        for i, option in enumerate(story_options, 1):
            option["id"] = str(uuid.uuid4())
            
            # Validate required fields
            if "title" not in option or "summary" not in option or "theme" not in option:
                raise ValueError(f"Story option {i} missing required fields")
        
        return story_options
        
    except Exception as e:
        raise Exception(f"OpenAI API call failed: {str(e)}")


async def generate_story_options_fallback(
    classroom_id: str,
    lesson_prompt: str
) -> List[Dict[str, Any]]:
    """
    Fallback function that generates story options without OpenAI.
    Useful for testing or when API is unavailable.
    
    Args:
        classroom_id: UUID of the classroom
        lesson_prompt: Teacher's lesson description
        
    Returns:
        List of 3 mock story options
    """
    import uuid
    
    classroom = get_classroom(classroom_id)
    theme = classroom.get("story_theme", "Adventure") if classroom else "Adventure"
    
    return [
        {
            "id": str(uuid.uuid4()),
            "title": f"{theme} Quest: The Learning Journey",
            "summary": f"Students embark on an exciting {theme.lower()} where they must use their knowledge about {lesson_prompt[:50]}... to solve challenges and save the day.",
            "theme": theme.lower()
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Mystery of the {lesson_prompt[:30]}...",
            "summary": f"A mysterious problem appears in the classroom, and students must work together using what they learned about {lesson_prompt[:50]}... to uncover the truth.",
            "theme": "mystery"
        },
        {
            "id": str(uuid.uuid4()),
            "title": f"Time Travelers Learn About {lesson_prompt[:30]}...",
            "summary": f"Students travel through time and discover how {lesson_prompt[:50]}... has shaped history, meeting famous figures along the way.",
            "theme": "time travel"
        }
    ]
