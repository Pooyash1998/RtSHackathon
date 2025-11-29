"""
Test script for story idea generation.
"""
import asyncio
import os
from dotenv import load_dotenv
from story_idea import generate_story_options_fallback

load_dotenv()


async def test_story_idea_generation():
    """Test the story idea generation with fallback (no API key needed)."""
    print("=" * 60)
    print("Story Idea Generation Test (Fallback Mode)")
    print("=" * 60)
    
    # Mock classroom ID
    classroom_id = "test-classroom-123"
    lesson_prompt = "Newton's Laws of Motion - forces, acceleration, and action-reaction pairs"
    
    print(f"\n📚 Classroom ID: {classroom_id}")
    print(f"📝 Lesson Prompt: {lesson_prompt}")
    print("\n🎨 Generating 3 story options...\n")
    
    try:
        options = await generate_story_options_fallback(classroom_id, lesson_prompt)
        
        print(f"✅ Generated {len(options)} story options:\n")
        
        for i, option in enumerate(options, 1):
            print(f"Option {i}:")
            print(f"  ID: {option['id']}")
            print(f"  Title: {option['title']}")
            print(f"  Theme: {option['theme']}")
            print(f"  Summary: {option['summary']}")
            print()
        
        print("=" * 60)
        print("✅ Test PASSED - Story options generated successfully!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Test FAILED: {e}")
        print("=" * 60)
        return False


if __name__ == "__main__":
    success = asyncio.run(test_story_idea_generation())
    exit(0 if success else 1)
