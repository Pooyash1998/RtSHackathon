# Materials Bucket Troubleshooting

## Current Error
Still getting "Bucket not found" error after running the SQL script.

## Troubleshooting Steps

### Step 1: Verify Bucket Exists in Supabase UI

1. Open Supabase Dashboard
2. Go to **Storage** section (left sidebar)
3. Look for a bucket named **"Materials"**

**Expected**: You should see "Materials" in the list

**If you don't see it**:
- The SQL script didn't run successfully
- Try creating it manually via UI

### Step 2: Check Bucket Name (Case Sensitive!)

The bucket name MUST be exactly: **`Materials`** (capital M)

**Check in Supabase**:
- Go to Storage
- Click on the bucket
- Verify the name is exactly "Materials" not "materials" or "MATERIALS"

### Step 3: Verify Bucket is Public

1. In Supabase Storage, click on "Materials" bucket
2. Look for "Public" badge or setting
3. It should say "Public bucket"

**If it's not public**:
- Click bucket settings
- Enable "Public bucket"
- Save

### Step 4: Check Policies

1. Go to **Storage** → **Policies** tab
2. Find policies for "Materials" bucket
3. You should see:
   - ✅ SELECT policy (for public read)
   - ✅ INSERT policy (for upload)
   - ✅ DELETE policy (for delete)

**If policies are missing**:
Run this SQL again:

```sql
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

### Step 5: Restart Backend Server

After creating the bucket, restart your backend:

```bash
# Stop the backend (Ctrl+C or kill the process)
# Then restart it
cd backend
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Step 6: Test with Python Script

Run the test script to verify:

```bash
python3 test-materials-bucket.py
```

**Expected output**:
```
✅ Connected to Supabase
📦 Listing all storage buckets:
  - Materials (public)
  - StudentPhotos (public)
  - Avatars (public)

🔍 Testing 'Materials' bucket:
  ✅ Bucket exists and is accessible
```

### Step 7: Check Backend Logs

Try uploading again and check the logs:

```bash
tail -f .logs/backend.log
```

Look for:
- "Uploading material: ..." (should appear)
- "Upload error: ..." (shows the actual error)

### Step 8: Manual Bucket Creation (If SQL Failed)

If the SQL script didn't work, create manually:

1. **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Fill in:
   - **Name**: `Materials` (exactly, with capital M)
   - **Public bucket**: ✅ **CHECK THIS BOX**
   - **File size limit**: 52428800 (50MB)
   - **Allowed MIME types**: `application/pdf`
4. Click **"Create bucket"**
5. Go to **Policies** tab
6. Click **"New policy"** for Materials bucket
7. Add policies for SELECT, INSERT, DELETE

### Common Issues

#### Issue 1: Bucket Name Mismatch
**Symptom**: "Bucket not found"
**Solution**: Bucket must be named exactly "Materials" (capital M)

#### Issue 2: Bucket Not Public
**Symptom**: Upload works but can't view files
**Solution**: Enable "Public bucket" in settings

#### Issue 3: Missing Policies
**Symptom**: "Permission denied" or "Unauthorized"
**Solution**: Add INSERT and DELETE policies

#### Issue 4: Backend Cache
**Symptom**: Still fails after creating bucket
**Solution**: Restart backend server

#### Issue 5: Wrong Supabase Project
**Symptom**: Bucket exists but still not found
**Solution**: Verify SUPABASE_URL in .env matches the project where you created the bucket

## Quick Verification Checklist

Run through this checklist:

- [ ] Bucket named "Materials" exists in Supabase Storage
- [ ] Bucket is set to "Public"
- [ ] SELECT policy exists for Materials
- [ ] INSERT policy exists for Materials
- [ ] DELETE policy exists for Materials
- [ ] Backend server has been restarted
- [ ] SUPABASE_URL in .env matches the project
- [ ] SUPABASE_KEY in .env is the service role key (not anon key)

## Still Not Working?

If you've tried everything above, let's debug together:

1. **Share the output of**:
   ```bash
   python3 test-materials-bucket.py
   ```

2. **Share the backend logs when uploading**:
   ```bash
   tail -20 .logs/backend.log
   ```

3. **Verify your .env**:
   ```bash
   grep SUPABASE backend/.env | head -2
   ```
   (Don't share the actual keys, just verify they're set)

4. **Check Supabase Storage UI**:
   - Take a screenshot of your Storage page showing the buckets
   - Verify "Materials" is there

## Alternative: Use Different Bucket Name

If "Materials" keeps failing, try using a different name:

1. Create bucket named "materials" (lowercase)
2. Update backend code:

```python
# In backend/src/main.py, change:
supabase.storage.from_("Materials")
# To:
supabase.storage.from_("materials")
```

3. Restart backend
4. Try again

## Summary

Most common fix:
1. ✅ Create bucket named "Materials" (capital M)
2. ✅ Make it public
3. ✅ Add policies
4. ✅ Restart backend
5. ✅ Try upload again

The bucket setup is a one-time thing - once it works, it'll work forever! 🎉
