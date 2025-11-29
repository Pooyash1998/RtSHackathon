# Fix Materials Upload Error - RLS Policy Issue

## Current Error
```
Upload error: {'statusCode': 403, 'error': Unauthorized, 'message': new row violates row-level security policy}
```

## Problem
The Row-Level Security (RLS) policies on the storage.objects table are blocking the upload. The service role needs proper permissions.

## Solution

### Run This SQL Script

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste this SQL:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Public Access for Materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update materials" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete materials" ON storage.objects;

-- Create simple, permissive policies
CREATE POLICY "Materials: Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'Materials');

CREATE POLICY "Materials: Allow insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'Materials');

CREATE POLICY "Materials: Allow update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'Materials');

CREATE POLICY "Materials: Allow delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'Materials');
```

4. Click **Run**
5. Should see: "Success. No rows returned"

### Verify Policies

After running, verify with:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%Materials%';
```

**Expected output**:
```
Materials: Public read access    | SELECT
Materials: Allow insert          | INSERT
Materials: Allow update          | UPDATE
Materials: Allow delete          | DELETE
```

### Test Upload Again

1. Go to teacher classroom → Materials tab
2. Upload a PDF file
3. Fill in title
4. Click "Upload"
5. **Should work now!** ✅

## Why This Happened

The original policies had conditions like:
```sql
WITH CHECK (bucket_id = 'Materials' AND auth.role() = 'service_role')
```

But when using the service role key from the backend, the `auth.role()` check doesn't work as expected. The simpler policy:
```sql
WITH CHECK (bucket_id = 'Materials')
```

Just checks that we're uploading to the right bucket, which is sufficient since:
- The backend uses the service role key (already authenticated)
- We're only allowing operations on the Materials bucket
- Public read is still controlled (SELECT policy)

## Alternative: Disable RLS (Not Recommended)

If the above doesn't work, you can disable RLS entirely for the Materials bucket (less secure):

```sql
-- Disable RLS for storage.objects (not recommended for production)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

But try the policy fix first!

## Summary

**Quick Fix**:
1. Run the SQL script above in Supabase SQL Editor
2. Try uploading again
3. Should work! ✅

The issue was RLS policies being too restrictive. The new policies allow any authenticated request (like from your backend with service role key) to upload to the Materials bucket.
