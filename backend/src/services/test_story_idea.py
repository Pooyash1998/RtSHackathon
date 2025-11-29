"""
Test script for story idea generation.
"""
import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from story_idea import generate_story_options, generate_story_options_fallback
from database.database import get_all_classrooms

load_dotenv()


async def test_with_real_classroom():
    """Test with a real classroom from the database."""
    print("=" * 60)
    print("Story Idea Generation Test (Real Classroom)")
    print("=" * 60)
    
    try:
        # Get first classroom from database
        classrooms = get_all_classrooms()
        
        if not classrooms:
            print("\n⚠️  No classrooms found in database")
            print("Please create a classroom first or use fallback test")
            return False
        
        classroom = classrooms[0]
        classroom_id = classroom["id"]
        
        print(f"\n📚 Using Classroom:")
        print(f"  ID: {classroom_id}")
        print(f"  Subject: {classroom.get('subject', 'N/A')}")
        print(f"  Grade: {classroom.get('grade_level', 'N/A')}")
        print(f"  Theme: {classroom.get('story_theme', 'N/A')}")
        
        lesson_prompt = "Newton's Laws of Motion - forces, acceleration, and action-reaction pairs"
        print(f"\n📝 Lesson Prompt: {lesson_prompt}")
        print("\n🎨 Generating 3 story options with OpenAI...\n")
        
        # Test with real OpenAI API
        options = await generate_story_options(classroom_id, lesson_prompt)
        
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
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return False


async def test_fallback_mode():
    """Test the fallback mode without needing a real classroom."""
    print("=" * 60)
    print("Story Idea Generation Test (Fallback Mode)")
    print("=" * 60)
    
    # Use a valid UUID format
    import uuid
    classroom_id = str(uuid.uuid4())
    lesson_prompt = "Newton's Laws of Motion - forces, acceleration, and action-reaction pairs"
    
    print(f"\n📚 Mock Classroom ID: {classroom_id}")
    print(f"📝 Lesson Prompt: {lesson_prompt}")
    print("\n🎨 Generating 3 story options (fallback mode)...\n")
    
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
        print("✅ Test PASSED - Fallback story options generated!")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ Test FAILED: {e}")
        import traceback
        traceback.print_exc()
        print("=" * 60)
        return False


async def main():
    """Run tests."""
    print("\n🧪 Starting Story Idea Service Tests\n")
    
    # Check if OpenAI API key is configured
    has_api_key = bool(os.getenv("OPENAI_API_KEY"))
    
    if has_api_key:
        print("✅ OpenAI API key found - will test with real API\n")
        success = await test_with_real_classroom()
    else:
        print("⚠️  No OpenAI API key - using fallback mode\n")
        success = await test_fallback_mode()
    
    return success


if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)
