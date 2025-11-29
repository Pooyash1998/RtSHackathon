# Quick Database Setup - Next Steps

Your `.env` file is ready with your Supabase credentials! ✅

## Step 1: Create the Database Tables

You need to run the SQL schema in Supabase to create your tables.

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to your Supabase project: https://app.supabase.com
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Open the file `backend/database.sql` in this project
5. Copy ALL the SQL code
6. Paste it into the Supabase SQL Editor
7. Click **"Run"** (or press Cmd/Ctrl + Enter)
8. You should see: ✅ "Success. No rows returned"

**Option B: I can show you the SQL to copy**

Would you like me to show you the SQL here so you can copy it easily?

## Step 2: Install Python Dependencies

After creating the tables, run:

```bash
cd backend
pip install -r requirements.txt
```

## Step 3: Test Your Connection

```bash
cd backend
python test_connection.py
```

You should see:
```
✅ Connection successful!
📊 Found 0 classrooms in database
📋 Table status:
  ✅ classrooms: 0 records
  ✅ students: 0 records
  ✅ stories: 0 records
  ✅ panels: 0 records
🎉 Database is ready to use!
```

## Step 4: Create Storage Bucket (for images)

1. In Supabase dashboard, click **"Storage"** in left sidebar
2. Click **"Create a new bucket"**
3. Name it: `story-images`
4. Check ✅ **"Public bucket"** (images need to be accessible)
5. Click **"Create bucket"**

---

## What's Next?

Once you complete these steps, your database will be fully set up and you can:
- Start building the FastAPI backend
- Create API endpoints
- Test with real data

**Need help?** Just let me know which step you're on!
