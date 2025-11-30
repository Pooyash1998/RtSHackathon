"""
Avatar generation service using Black Forest Labs API.
"""
import os
import asyncio
import httpx
import uuid
from typing import Optional, Dict, Any
from database.database import get_student, update_student, get_classroom, supabase


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
    student = get_student(student_id)
    if not student:
        raise ValueError(f"Student with ID {student_id} not found")

    # Get classroom to retrieve design_style (student can be in multiple classrooms)
    # For avatar generation, we'll use the first classroom or None if not in any
    classroom = None
    try:
        # Query the junction table to find classrooms this student is in
        from database.database import supabase
        response = supabase.table("student_classrooms").select(
            "classrooms(*)"
        ).eq("student_id", student_id).limit(1).execute()
        
        if response.data and response.data[0].get("classrooms"):
            classroom = response.data[0]["classrooms"]
    except Exception as e:
        print(f"[WARN] Could not fetch classroom for student {student_id}: {e}")
        # Continue without classroom - will use default design style

    # Get API key
    api_key = os.getenv("BLACK_FOREST_API_KEY")
    if not api_key:
        raise ValueError("BLACK_FOREST_API_KEY not configured in environment")

    # Build prompt for avatar generation
    prompt = _build_avatar_prompt(student, classroom)
    photo_url = student.get("photo_url")

    # Call Black Forest Labs API to generate avatar
    bfl_avatar_url = await _call_black_forest_api(prompt, api_key, photo_url)

    # Download and upload to Supabase storage
    supabase_avatar_url = await _upload_avatar_to_storage(bfl_avatar_url, student_id)

    # Update student record with Supabase avatar URL
    updated_student = update_student(student_id, {"avatar_url": supabase_avatar_url})

    return updated_student


def _build_avatar_prompt(student: Dict[str, Any], classroom: Optional[Dict[str, Any]] = None) -> str:
    """
    Build a prompt for avatar generation based on student data.
    
    Args:
        student: Student data dictionary
        classroom: Classroom data dictionary (optional)
        
    Returns:
        Prompt string for image generation
    """
    interests = student.get("interests", "")
    photo_url = student.get("photo_url")

    # Get comic style from classroom, default to manga
    comic_style = classroom.get("design_style", "manga") if classroom else "manga"

    prompt = (
        f"Full-body avatar of this child, using the reference photo to preserve their face, "
        f"skin tone, hairstyle, and body shape. The child is standing in a relaxed, front-facing pose, "
        f"centered in the frame, single character only. In the style of a {comic_style} classroom comic strip: "
        f"clean line art, flat colors, friendly and age-appropriate. "
        f"Outfit and accessories reflect the child's interests: {interests}. "
        f"Plain white background, simple studio look, soft even lighting."
    )

    return prompt


async def _call_black_forest_api(prompt: str, api_key: str, image_url: Optional[str] = None) -> str:

    """
    Call Black Forest Labs API to generate an image.
    
    Args:
        prompt: Text prompt for image generation
        api_key: Black Forest Labs API key
        image_url: Optional reference image URL for image-to-image generation
        
    Returns:
        URL of the generated image
        
    Raises:
        httpx.HTTPError: If API request fails
    """
    url = "https://api.bfl.ai/v1/flux-2-flex"


    headers = {
        "accept": "application/json",
        "x-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "prompt": prompt


    }

    # Add reference image if provided
    if image_url:
        payload["input_image"] = image_url


    async with httpx.AsyncClient(timeout=120.0) as client:
        # Submit generation request
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()

        result = response.json()
        request_id = result.get("id")
        polling_url = result.get("polling_url")

        if not request_id or not polling_url:
            raise ValueError("No request ID or polling URL returned from Black Forest Labs API")

        # Poll for result using the polling URL

        max_attempts = 60

        for attempt in range(max_attempts):
            await asyncio.sleep(2)  # Wait 2 seconds between polls

            result_response = await client.get(polling_url, headers=headers)
            result_response.raise_for_status()

            result_data = result_response.json()
            status = result_data.get("status")

            if status == "Ready":
                generated_image_url = result_data.get("result", {}).get("sample")
                if generated_image_url:
                    return generated_image_url
                raise ValueError("No image URL in completed result")

            elif status == "Error":
                error_msg = result_data.get("error", "Unknown error")
                raise ValueError(f"Image generation failed: {error_msg}")

            elif status in ["Pending", "Request Moderated"]:
                # Continue polling
                continue

        raise TimeoutError("Image generation timed out after 120 seconds")


async def _upload_avatar_to_storage(image_url: str, student_id: str) -> str:
    """
    Download image from URL and upload to Supabase Avatars bucket.
    
    Args:
        image_url: URL of the generated image from Black Forest Labs
        student_id: UUID of the student (used for filename)
        
    Returns:
        Public URL of the uploaded image in Supabase storage
        
    Raises:
        httpx.HTTPError: If image download fails
        Exception: If upload to Supabase fails
    """
    print(f"Downloading avatar from Black Forest Labs: {image_url}")
    
    # Download the image from Black Forest Labs
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(image_url)
        response.raise_for_status()
        image_data = response.content
    
    print(f"Downloaded {len(image_data)} bytes")
    
    # Generate filename with student ID
    filename = f"{student_id}.png"
    
    try:
        # Upload to Supabase storage in Avatars bucket (with upsert to replace if exists)
        print(f"Uploading to Supabase Avatars bucket: {filename}")
        
        storage_response = supabase.storage.from_("Avatars").upload(
            path=filename,
            file=image_data,
            file_options={
                "content-type": "image/png",
                "cache-control": "3600",
                "upsert": "true"  # Replace if already exists
            }
        )
        
        # Check for upload errors
        if hasattr(storage_response, 'error') and storage_response.error:
            raise Exception(f"Supabase upload error: {storage_response.error}")
            
    except Exception as upload_error:
        print(f"Upload error: {upload_error}")
        raise Exception(f"Failed to upload avatar to Supabase: {str(upload_error)}")
    
    # Get public URL
    public_url = supabase.storage.from_("Avatars").get_public_url(filename)
    
    print(f"Avatar uploaded successfully: {public_url}")
    
    return public_url