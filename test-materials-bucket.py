#!/usr/bin/env python3
"""
Test script to verify Materials bucket exists and is accessible.
"""
import os
import sys
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv('backend/.env')

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL and SUPABASE_KEY must be set in .env file")
    sys.exit(1)

print("🔍 Testing Supabase Storage Buckets...")
print(f"URL: {SUPABASE_URL}")
print()

try:
    # Create Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("✅ Connected to Supabase")
    print()
    
    # List all buckets
    print("📦 Listing all storage buckets:")
    try:
        buckets = supabase.storage.list_buckets()
        if buckets:
            for bucket in buckets:
                bucket_id = bucket.get('id') or bucket.get('name')
                is_public = bucket.get('public', False)
                print(f"  - {bucket_id} {'(public)' if is_public else '(private)'}")
        else:
            print("  No buckets found")
    except Exception as e:
        print(f"  ❌ Error listing buckets: {e}")
    
    print()
    
    # Check specific buckets
    buckets_to_check = ['Materials', 'StudentPhotos', 'Avatars']
    
    for bucket_name in buckets_to_check:
        print(f"🔍 Testing '{bucket_name}' bucket:")
        try:
            # Try to list files in the bucket
            files = supabase.storage.from_(bucket_name).list()
            print(f"  ✅ Bucket exists and is accessible")
            print(f"  📁 Contains {len(files)} items")
        except Exception as e:
            error_msg = str(e)
            if 'not found' in error_msg.lower() or '404' in error_msg:
                print(f"  ❌ Bucket does not exist")
            else:
                print(f"  ⚠️  Error: {error_msg}")
        print()
    
    # Try to get public URL (this will work even if bucket is empty)
    print("🔗 Testing public URL generation:")
    for bucket_name in buckets_to_check:
        try:
            test_url = supabase.storage.from_(bucket_name).get_public_url("test.pdf")
            print(f"  {bucket_name}: {test_url[:80]}...")
        except Exception as e:
            print(f"  {bucket_name}: ❌ {e}")
    
except Exception as e:
    print(f"❌ Failed to connect: {e}")
    sys.exit(1)

print()
print("✅ Test complete!")
