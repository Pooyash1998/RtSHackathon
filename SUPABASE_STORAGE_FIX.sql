-- ============================================
-- SUPABASE STORAGE SETUP FOR STUDENT PHOTOS
-- ============================================
-- Run this in your Supabase SQL Editor

-- Step 1: Create the StudentPhotos bucket (if not exists)
-- Go to Storage in Supabase Dashboard and create bucket "StudentPhotos"
-- Make it PUBLIC

-- Step 2: Set up RLS policies for StudentPhotos bucket
-- This allows anyone to upload and read photos (for MVP without auth)

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anyone to upload to StudentPhotos bucket
CREATE POLICY "Allow public uploads to StudentPhotos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'StudentPhotos');

-- Policy 2: Allow anyone to read from StudentPhotos bucket
CREATE POLICY "Allow public reads from StudentPhotos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'StudentPhotos');

-- Policy 3: Allow anyone to update in StudentPhotos bucket (for overwrites)
CREATE POLICY "Allow public updates to StudentPhotos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'StudentPhotos');

-- Policy 4: Allow anyone to delete from StudentPhotos bucket
CREATE POLICY "Allow public deletes from StudentPhotos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'StudentPhotos');

-- Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
