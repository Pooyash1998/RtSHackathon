# Setup Materials Bucket - Quick Fix

## Problem
Getting error: **"Bucket not found"** when uploading materials.

The "Materials" storage bucket doesn't exist in Supabase yet.

## Solution

### Option 1: Run SQL Script (Recommended)

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Open the file: `backend/src/database/setup_materials_bucket.sql`
4. Copy all the SQL
5. Paste into SQL Editor
6. Click **Run**

This will:
- ✅ Create "Materials" bucket
- ✅ Set it to public (for viewing)
- ✅ Add permissions for uploading/deleting

### Option 2: Manual Setup via UI

1. Open Supabase Dashboard
2. Go to **Storage** section
3. Click **"New bucket"**
4. Enter:
   - **Name**: `Materials`
   - **Public bucket**: ✅ Check this box
5. Click **Create bucket**

6. Set up policies:
   - Go to **Storage** → **Policies**
   - Click **New Policy** for the Materials bucket
   - Add these policies:
     - **SELECT**: Allow public access
     - **INSERT**: Allow authenticated users
     - **UPDATE**: Allow authenticated users
     - **DELETE**: Allow authenticated users

## Verify Setup

After creating the bucket, test the upload:

1. Go to teacher classroom → Materials tab
2. Upload a PDF file
3. Fill in title
4. Click "Upload"
5. **Expected**: ✅ Success! Material appears in list

## Quick SQL (Copy-Paste)

If you just want to copy-paste quickly:

```sql
-- Create Materials bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('Materials', 'Materials', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read
CREATE POLICY "Public Access for Materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'Materials');

-- Allow authenticated upload
CREATE POLICY "Service role can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'Materials' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);

-- Allow authenticated delete
CREATE POLICY "Service role can delete materials"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'Materials' 
    AND (auth.role() = 'authenticated' OR auth.role() = 'service_role')
);
```

## Why This Happened

The code expects these Supabase storage buckets:
- ✅ **StudentPhotos** - Already exists (for student photos)
- ✅ **Avatars** - Already exists (for generated avatars)
- ❌ **Materials** - Needs to be created (for classroom materials)

## After Setup

Once the bucket is created, materials will:
- Upload to: `Materials/{classroom_id}/{uuid}.pdf`
- Be publicly viewable via URL
- Be manageable (upload/delete) by teachers

## Summary

**Quick Fix**:
1. Open Supabase → SQL Editor
2. Run `setup_materials_bucket.sql`
3. Try uploading again
4. ✅ Should work!

The bucket only needs to be created once, then all material uploads will work! 🎉
