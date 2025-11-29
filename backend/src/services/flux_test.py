"""
Test script for Black Forest Labs (FLUX) API integration.
"""
import os
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv()


async def test_flux_api():
    """Test the Black Forest Labs API with a simple prompt."""
    api_key = os.getenv("BLACK_FOREST_API_KEY")
    
    if not api_key:
        print("❌ BLACK_FOREST_API_KEY not found in environment")
        return False
    
    print(f"✅ API Key found: {api_key[:20]}...")
    print("🎨 Testing FLUX API with a simple prompt...")
    
    url = "https://api.bfl.ai/v1/flux-pro-1.1"
    
    headers = {
        "accept": "application/json",
        "x-key": api_key,
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt": "A friendly cartoon character of a young student with a backpack, manga style, simple clean lines, white background",
        "width": 512,
        "height": 512
    }
    
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            print("📤 Sending request to Black Forest Labs API...")
            response = await client.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            request_id = result.get("id")
            
            print(f"✅ Request submitted! ID: {request_id}")
            print("⏳ Polling for result...")
            
            # Poll for result - request ID in URL path
            get_url = f"https://api.bfl.ai/v1/get_result/{request_id}"
            
            for attempt in range(60):
                await asyncio.sleep(2)
                
                result_response = await client.get(get_url, headers=headers)
                result_response.raise_for_status()
                
                result_data = result_response.json()
                status = result_data.get("status")
                
                print(f"   Attempt {attempt + 1}/60: Status = {status}")
                
                if status == "Ready":
                    image_url = result_data.get("result", {}).get("sample")
                    print(f"\n✅ SUCCESS! Image generated:")
                    print(f"   URL: {image_url}")
                    return True
                
                elif status == "Error":
                    error_msg = result_data.get("error", "Unknown error")
                    print(f"\n❌ ERROR: {error_msg}")
                    return False
            
            print("\n⏱️  Timeout: Image generation took too long")
            return False
            
    except httpx.HTTPError as e:
        print(f"\n❌ HTTP Error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("Black Forest Labs (FLUX) API Test")
    print("=" * 60)
    
    success = asyncio.run(test_flux_api())
    
    print("\n" + "=" * 60)
    if success:
        print("✅ Test PASSED - Black Forest API is working!")
    else:
        print("❌ Test FAILED - Check the errors above")
    print("=" * 60)
