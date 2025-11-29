"""
Test script to verify Supabase connection.
Run this after setting up your .env file.
"""
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("🔍 Testing Supabase connection...")
print(f"URL: {os.getenv('SUPABASE_URL')}")
print(f"Key: {os.getenv('SUPABASE_KEY')[:20]}...")

try:
    from database import supabase
    
    # Test connection by querying classrooms table
    response = supabase.table("classrooms").select("*").execute()
    
    print("✅ Connection successful!")
    print(f"📊 Found {len(response.data)} classrooms in database")
    
    # Test each table
    tables = ["classrooms", "students", "stories", "panels"]
    print("\n📋 Table status:")
    for table in tables:
        try:
            result = supabase.table(table).select("*", count="exact").execute()
            print(f"  ✅ {table}: {result.count} records")
        except Exception as e:
            print(f"  ❌ {table}: {str(e)}")
    
    print("\n🎉 Database is ready to use!")
    
except Exception as e:
    print(f"❌ Connection failed: {str(e)}")
    print("\n💡 Troubleshooting:")
    print("1. Make sure you ran the SQL schema in Supabase SQL Editor")
    print("2. Check your SUPABASE_URL and SUPABASE_KEY in .env")
    print("3. Verify your Supabase project is active")
