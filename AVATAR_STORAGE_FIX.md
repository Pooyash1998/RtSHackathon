# Avatar Storage Fix - Using Supabase Storage

## Problem
Previously, the avatar generation flow was storing the Black Forest Labs temporary URL directly in the database. These URLs are short-lived and would expire, causing avatars to disappear.

## Solution
Updated the avatar generation flow to:
1. Generate avatar using Black Forest Labs API
2. Download the generated image
3. Upload to Supabase "Avatars" bucket for permanent storage
4. Store the Supabase public URL in the database

## Updated Flow

### Avatar Generation Process

```
Student Creation
    ↓
1. Upload student photo → Supabase "StudentPhotos" bucket
    ↓
2. Create student record with photo_url
    ↓
3. Generate avatar via Black Forest Labs API
    ↓
4. Download avatar from BFL temporary URL
    ↓
5. Upload avatar → Supabase "Avatars" bucket
    ↓
6. Update student record with Supabase avatar_url
    ↓
Done ✓
```

## Code Changes

### `backend/src/services/avatar.py`

#### 1. Added Import
```python
from database.database import get_student, update_student, get_classroom, supabase
```

#### 2. Updated `generate_avatar()` Function
```python
# Call Black Forest Labs API to generate avatar
bfl_avatar_url = await _call_black_forest_api(prompt, api_key, photo_url)

# Download and upload to Supabase storage
supabase_avatar_url = await _upload_avatar_to_storage(bfl_avatar_url, student_id)

# Update student record with Supabase avatar URL
updated_student = update_student(student_id, {"avatar_url": supabase_avatar_url})
```

#### 3. Enhanced `_upload_avatar_to_storage()` Function
- Downloads image from Black Forest Labs URL
- Uploads to Supabase "Avatars" bucket
- Uses `upsert: true` to replace existing avatars
- Includes proper error handling and logging
- Returns permanent Supabase public URL

## Storage Buckets

### StudentPhotos Bucket
- Stores original student photos uploaded by users
- Used as reference for avatar generation
- Public access for display

### Avatars Bucket
- Stores generated avatars from Black Forest Labs
- Permanent storage (not temporary URLs)
- Public access for display
- Filename format: `{student_id}.png`

## Benefits

1. **Permanent Storage**: Avatars won't expire or disappear
2. **Consistent URLs**: Same URL structure as student photos
3. **Better Performance**: Served from Supabase CDN
4. **Upsert Support**: Can regenerate avatars without creating duplicates
5. **Cost Effective**: No need to store in Black Forest Labs

## Supabase Storage Setup

✅ The "Avatars" bucket already exists in your Supabase project with proper permissions.

## Testing

To test the updated flow:

1. Create a student with a photo
2. Avatar generation will automatically:
   - Call Black Forest Labs API
   - Download the generated image
   - Upload to Supabase Avatars bucket
   - Store the Supabase URL in database
3. Verify the avatar_url in the database points to Supabase storage
4. Check that the avatar displays correctly and doesn't expire

## Example URLs

**Before (Temporary BFL URL)**:
```
https://api.bfl.ai/v1/get_result?id=abc123...
```

**After (Permanent Supabase URL)**:
```
https://[project-id].supabase.co/storage/v1/object/public/Avatars/[student-id].png
```

## Error Handling

The code includes comprehensive error handling:
- Download failures from Black Forest Labs
- Upload failures to Supabase
- Proper logging at each step
- Graceful fallback (student still has photo_url if avatar fails)

## Notes

- Avatar filename uses student_id for easy identification
- Upsert mode allows regenerating avatars without manual deletion
- Both photo and avatar are stored in Supabase for consistency
- All storage operations include proper content-type headers
