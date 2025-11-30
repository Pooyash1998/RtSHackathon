"""
Thumbnail generation service using Black Forest Labs (Flux) API.
Generates temporary thumbnails for story options (not stored).
"""

import os
import asyncio
import httpx
from typing import Optional

FLUX_API_URL = "https://api.bfl.ml/v1"
BLACK_FOREST_API_KEY = os.getenv("BLACK_FOREST_API_KEY")


async def generate_story_thumbnail(title: str, summary: str) -> Optional[str]:
    """
    Generate a thumbnail image for a story option using Flux.
    
    Args:
        title: Story title
        summary: Story summary
        
    Returns:
        Image URL or None if generation fails
    """
    if not BLACK_FOREST_API_KEY:
        print("⚠️ BLACK_FOREST_API_KEY not configured, skipping thumbnail generation")
        return None
    
    try:
        # Create a simple prompt based on the story
        # Important: Explicitly tell Flux NOT to include any text/words/letters
        prompt = f"A simple, colorful thumbnail illustration for an educational story titled '{title}'. {summary[:100]}. Style: educational, friendly, cartoon-like, suitable for students, vibrant colors. NO TEXT, NO WORDS, NO LETTERS, NO TITLES in the image. Pure illustration only."
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Start generation
            response = await client.post(
                f"{FLUX_API_URL}/flux-2-pro",
                headers={
                    "Content-Type": "application/json",
                    "X-Key": BLACK_FOREST_API_KEY,
                },
                json={
                    "prompt": prompt,
                    "width": 512,
                    "height": 512,
                    "prompt_upsampling": False,
                    "safety_tolerance": 2,
                }
            )
            
            if response.status_code != 200:
                print(f"❌ Flux API error: {response.status_code}")
                return None
            
            data = response.json()
            task_id = data.get("id")
            
            if not task_id:
                print("❌ No task ID returned from Flux API")
                return None
            
            # Poll for result
            return await poll_for_result(client, task_id)
                
    except Exception as e:
        print(f"❌ Failed to generate thumbnail: {e}")
        import traceback
        traceback.print_exc()
        return None


async def poll_for_result(client: httpx.AsyncClient, task_id: str) -> Optional[str]:
    """
    Poll Flux API for generation result.
    
    Args:
        client: httpx client
        task_id: Task ID from Flux API
        
    Returns:
        Image URL or None if polling fails/times out
    """
    max_attempts = 30  # 30 seconds max
    poll_interval = 1  # 1 second
    
    for i in range(max_attempts):
        try:
            response = await client.get(
                f"{FLUX_API_URL}/get_result",
                params={"id": task_id},
                headers={"X-Key": BLACK_FOREST_API_KEY}
            )
            
            if response.status_code != 200:
                print(f"❌ Flux polling error: {response.status_code}")
                return None
            
            data = response.json()
            status = data.get("status")
            
            if status == "Ready":
                image_url = data.get("result", {}).get("sample")
                if image_url:
                    print(f"✅ Thumbnail generated successfully")
                    return image_url
            
            if status == "Error":
                print(f"❌ Flux generation failed: {data.get('error')}")
                return None
            
            # Wait before next poll
            await asyncio.sleep(poll_interval)
                
        except Exception as e:
            print(f"❌ Polling error: {e}")
            return None
    
    print("⚠️ Thumbnail generation timed out")
    return None
