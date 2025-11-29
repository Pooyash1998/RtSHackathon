# Supabase Setup Guide

## Step 1: Create Supabase Account (5 minutes)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new organization (or use existing)

## Step 2: Create New Project (5 minutes)

1. Click "New Project"
2. Fill in project details:
   - **Name**: `classroom-story-platform` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is fine for hackathon
3. Click "Create new project"
4. Wait 2-3 minutes for project to initialize

## Step 3: Get Your API Credentials

1. In your Supabase project dashboard, click "Settings" (gear icon)
2. Click "API" in the left sidebar
3. Copy these values:
   - **Project URL** → This is your `SUPABASE_URL`
   - **anon public** key → This is your `SUPABASE_KEY`

## Step 4: Create Database Schema

1. In Supabase dashboard, click "SQL Editor" in left sidebar
2. Click "New query"
3. Copy the entire contents of `backend/database.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Cmd/Ctrl + Enter)
6. You should see: "Success. No rows returned"

## Step 5: Set Up Storage Bucket (for images)

1. In Supabase dashboard, click "Storage" in left sidebar
2. Click "Create a new bucket"
3. Bucket details:
   - **Name**: `story-images`
   - **Public bucket**: ✅ Check this (images need to be publicly accessible)
4. Click "Create bucket"

## Step 6: Configure Your Backend

1. Copy `backend/.env.example` to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` and fill in your credentials:
   ```env
   SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   OPENAI_API_KEY=sk-...
   FLUX_API_KEY=...
   ```

## Step 7: Verify Database Setup

Run this test query in Supabase SQL Editor:

```sql
-- Check all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Should return: classrooms, students, stories, panels
```

## Step 8: Test Connection from Backend

1. Install Python dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. Test the connection:
   ```python
   # test_connection.py
   from database import supabase
   
   # Try to query classrooms table
   response = supabase.table("classrooms").select("*").execute()
   print(f"Connection successful! Found {len(response.data)} classrooms")
   ```

3. Run the test:
   ```bash
   python test_connection.py
   ```

## Troubleshooting

### "relation does not exist" error
- Make sure you ran the SQL schema in Step 4
- Check you're in the correct project

### "Invalid API key" error
- Double-check your `SUPABASE_KEY` in `.env`
- Make sure you copied the **anon public** key, not the service role key

### Connection timeout
- Check your `SUPABASE_URL` is correct
- Verify your internet connection
- Check Supabase project status (might be paused on free tier)

### Foreign key constraint errors
- This is expected! It means your constraints are working
- Make sure to create parent records (classrooms) before child records (students)

## Database Schema Overview

```
classrooms (id, name, subject, grade_level, story_theme, design_style, duration)
    ↓
students (id, classroom_id, name, interests, avatar_url, photo_url)
    ↓
stories (id, classroom_id, lesson_prompt, title, status, progress)
    ↓
panels (id, story_id, panel_number, image_url, dialogue, scene_description)
```

## Next Steps

Once your database is set up:
1. ✅ Share your `.env` file with your team (via secure channel, NOT git!)
2. ✅ Start implementing the backend API endpoints
3. ✅ Test CRUD operations with your database

## Quick Reference

**Supabase Dashboard**: https://app.supabase.com/project/YOUR_PROJECT_ID

**Useful SQL Queries**:
```sql
-- Count records in each table
SELECT 'classrooms' as table_name, COUNT(*) FROM classrooms
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'stories', COUNT(*) FROM stories
UNION ALL
SELECT 'panels', COUNT(*) FROM panels;

-- View recent stories with status
SELECT id, title, status, progress, created_at 
FROM stories 
ORDER BY created_at DESC 
LIMIT 10;

-- Clear all data (for testing)
TRUNCATE classrooms CASCADE;
```
