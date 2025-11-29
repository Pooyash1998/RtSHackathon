"""
Avatar generation service using Black Forest Labs API.
"""
import os
import asyncio
import httpx
from typing import Optional, Dict, Any
from database import get_student, update_student


async def generate_avatar(student_id: str) -> Dict[str, Any]:
    """
    Generate an avatar for a student using Black Forest Labs API.
    
    Args:
        student_id: The UUID of the student
        
    Returns:
        Dict containing the student data with updated avatar_url
        
    Raises:
        ValueError: If student not found or API key not configured
        httpx.HTTPError: If API request fails
    """
    # Get student from database
    student = await get_student(student_id)
    if not student:
        raise ValueError(f"Student with ID {student_id} not found")
    
    # Get API key
    api_key = os.getenv("BLACK_FOREST_API_KEY")
    if not api_key:
        raise ValueError("BLACK_FOREST_API_KEY not configured in environment")
    
    # Build prompt for avatar generation
    prompt = _build_avatar_prompt(student)
    
    # Call Black Forest Labs API
    avatar_url = await _call_black_forest_api(prompt, api_key)
    
    # Update student record with avatar URL
    updated_student = await update_student(student_id, {"avatar_url": avatar_url})
    
    return updated_student


def _build_avatar_prompt(student: Dict[str, Any]) -> str:
    """
    Build a prompt for avatar generation based on student data.
    
    Args:
        student: Student data dictionary
        
    Returns:
        Prompt string for image generation
    """
    name = student.get("name", "student")
    interests = student.get("interests", "")
    
    # Create a child-friendly avatar prompt
    prompt = f"A friendly cartoon avatar of a child named {name}"
    
    if interests:
        prompt += f", who enjoys {interests}"
    
    prompt += ". Colorful, cheerful, educational style, suitable for children's books. Simple and clean design."
    
    return prompt


async def _call_black_forest_api(prompt: str, api_key: str) -> str:
    """
    Call Black Forest Labs API to generate an image.
    
    Args:
        prompt: Text prompt for image generation
        api_key: Black Forest Labs API key
        
    Returns:
        URL of the generated image
        
    Raises:
        httpx.HTTPError: If API request fails
    """
    url = "https://api.bfl.ml/v1/flux-pro-1.1"
    
    headers = {
        "Content-Type": "application/json",
        "X-Key": api_key
    }
    
    payload = {
        "prompt": prompt,
        "width": 512,
        "height": 512,
        "prompt_upsampling": False,
        "safety_tolerance": 2
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # Submit generation request
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        task_id = result.get("id")
        
        if not task_id:
            raise ValueError("No task ID returned from Black Forest Labs API")
        
        # Poll for result
        result_url = f"https://api.bfl.ml/v1/get_result?id={task_id}"
        
        # Wait for generation to complete
        max_attempts = 30
        for attempt in range(max_attempts):
            await asyncio.sleep(2)  # Wait 2 seconds between polls
            
            result_response = await client.get(result_url, headers=headers)
            result_response.raise_for_status()
            
            result_data = result_response.json()
            status = result_data.get("status")
            
            if status == "Ready":
                image_url = result_data.get("result", {}).get("sample")
                if image_url:
                    return image_url
                raise ValueError("No image URL in completed result")
            
            elif status == "Error":
                error_msg = result_data.get("error", "Unknown error")
                raise ValueError(f"Image generation failed: {error_msg}")
        
        raise TimeoutError("Image generation timed out after 60 seconds")
