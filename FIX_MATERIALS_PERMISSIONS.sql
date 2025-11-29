-- Fix Materials Bucket Permissions
-- Run this in Supabase SQL Editor

-- First, drop all existing policies for Materials
DROP POLICY IF EXISTS "Public Access for Materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete materials" ON storage.objects;

-- Create simple, permissive policies that work with service role

-- Allow anyone to read (public bucket)
CREATE POLICY "Materials: Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'Materials');

-- Allow anyone authenticated to insert
CREATE POLICY "Materials: Allow insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Materials');

-- Allow anyone authenticated to update
CREATE POLICY "Materials: Allow update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Materials');

-- Allow anyone authenticated to delete
CREATE POLICY "Materials: Allow delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'Materials');

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%Materials%'
ORDER BY policyname;
