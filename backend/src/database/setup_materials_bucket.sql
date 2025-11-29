-- Setup Materials Storage Bucket for EduComic
-- This script creates the Materials bucket and sets up proper permissions

-- Create Materials bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Materials', 'Materials', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access for Materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete materials" ON storage.objects;

-- Allow public read access to materials
CREATE POLICY "Public Access for Materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'Materials');

-- Allow service role (backend) to upload materials
-- Note: Service role bypasses RLS, but we need a permissive policy
CREATE POLICY "Service role can upload materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Materials');

-- Allow service role (backend) to update/replace materials
CREATE POLICY "Service role can update materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Materials');

-- Allow service role to delete materials (for cleanup)
CREATE POLICY "Service role can delete materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'Materials');

-- Verify the bucket was created
SELECT 
    id,
    name,
    public,
    created_at
FROM storage.buckets
WHERE id = 'Materials';

-- Show the policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%Materials%';
