# Fix Supabase Storage Permissions 🔧

## Problem

Student photo uploads are failing due to Supabase Storage RLS (Row Level Security) blocking uploads.

## Solution

You need to configure the StudentPhotos bucket in Supabase with proper permissions.

## Step-by-Step Fix

### Option 1: Using Supabase Dashboard (Easiest)

#### Step 1: Create/Check Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **"Storage"** in the left sidebar
4. Check if **"StudentPhotos"** bucket exists
   - If YES: Click on it
   - If NO: Click **"New bucket"**
     - Name: `StudentPhotos`
     - ✅ Check **"Public bucket"**
     - Click **"Create bucket"**

#### Step 2: Make Bucket Public

1. Click on the **"StudentPhotos"** bucket
2. Click the **"⚙️ Settings"** icon (top right)
3. Make sure **"Public bucket"** is enabled
4. Click **"Save"**

#### Step 3: Set Up Policies

1. In the **"StudentPhotos"** bucket settings
2. Click **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"For full customization"**

**Policy 1: Allow Uploads**
```
Policy name: Allow public uploads
Allowed operation: INSERT
Target roles: public
WITH CHECK expression: true
```

**Policy 2: Allow Reads**
```
Policy name: Allow public reads
Allowed operation: SELECT
Target roles: public
USING expression: true
```

**Policy 3: Allow Updates**
```
Policy name: Allow public updates
Allowed operation: UPDATE
Target roles: public
USING expression: true
```

**Policy 4: Allow Deletes**
```
Policy name: Allow public deletes
Allowed operation: DELETE
Target roles: public
USING expression: true
```

### Option 2: Using SQL (Advanced)

1. Go to **"SQL Editor"** in Supabase Dashboard
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow anyone to upload to StudentPhotos bucket
CREATE POLICY "Allow public uploads to StudentPhotos"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'StudentPhotos');

-- Allow anyone to read from StudentPhotos bucket
CREATE POLICY "Allow public reads from StudentPhotos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'StudentPhotos');

-- Allow anyone to update in StudentPhotos bucket
CREATE POLICY "Allow public updates to StudentPhotos"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'StudentPhotos');

-- Allow anyone to delete from StudentPhotos bucket
CREATE POLICY "Allow public deletes from StudentPhotos"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'StudentPhotos');
```

4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: ✅ "Success"

### Option 3: Disable RLS Completely (Quick Test)

**⚠️ Only for testing! Not recommended for production.**

1. Go to **"SQL Editor"**
2. Run this:

```sql
-- Disable RLS on storage.objects (allows all operations)
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

This will allow all uploads without any restrictions. Use only for testing!

## Verify Setup

### Test 1: Check Bucket Exists

1. Go to **Storage** in Supabase Dashboard
2. You should see **"StudentPhotos"** bucket
3. It should show as **"Public"**

### Test 2: Test Upload via API

```bash
# Create a test image file
echo "test" > test.jpg

# Upload it
curl -X POST http://localhost:8000/students/upload-photo \
  -F "file=@test.jpg" \
  -F "filename=test.jpg"
```

Expected response:
```json
{
  "success": true,
  "photo_url": "https://kaqzpowphxavirkeevjy.supabase.co/storage/v1/object/public/StudentPhotos/..."
}
```

### Test 3: Test in Browser

1. Open: http://localhost:8080/student/signup
2. Fill form and upload a photo
3. Click "Create Account"
4. Should see: "📸 Uploading your photo..." → "✅ Photo uploaded!"

## Common Issues

### Issue 1: "Bucket not found"

**Solution:** Create the StudentPhotos bucket in Supabase Dashboard

### Issue 2: "new row violates row-level security policy"

**Solution:** Add the RLS policies from Option 2 above

### Issue 3: "Permission denied"

**Solution:** Make sure bucket is set to "Public" in settings

### Issue 4: "Invalid API key"

**Solution:** Check your `.env` file has correct `SUPABASE_KEY`

## Backend Error Handling

I've added better error messages to the backend:

```python
# Validates file type
allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

# Validates file size (max 10MB)
max_size = 10 * 1024 * 1024

# Better error messages
"Supabase upload failed: {error}. Check storage bucket permissions."
```

## Check Backend Logs

When you try to upload, check the backend terminal for logs:

```
Uploading photo: abc123.jpg, size: 123456 bytes, type: image/jpeg
Photo uploaded successfully: https://...
```

Or if it fails:
```
Upload error: new row violates row-level security policy
```

This tells you exactly what's wrong!

## Security Note

For MVP without authentication, we're allowing public uploads. In production, you should:

1. Add user authentication
2. Restrict uploads to authenticated users
3. Add file size limits
4. Scan for malicious files
5. Add rate limiting

But for now, public access is fine for testing.

## Quick Checklist

- [ ] StudentPhotos bucket exists in Supabase
- [ ] Bucket is set to "Public"
- [ ] RLS policies are configured (Option 1 or 2)
- [ ] Backend is running
- [ ] Test upload works via curl
- [ ] Test upload works in browser

## Still Not Working?

If you've done all the above and it still fails:

1. **Check backend logs** for the exact error
2. **Check browser console** (F12) for errors
3. **Share the error message** and I'll help debug

Common error messages:
- "new row violates row-level security policy" → Need RLS policies
- "Bucket not found" → Need to create bucket
- "Invalid file type" → Wrong file format
- "File too large" → File over 10MB

## Success! 🎉

Once configured, students can upload photos and they'll be stored permanently in Supabase Storage!
