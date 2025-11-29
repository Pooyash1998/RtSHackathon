# Materials Setup for Teachers

## Quick Setup (5 minutes)

### Step 1: Add Materials Table to Database

Run this SQL in Supabase SQL Editor:

1. Go to https://app.supabase.com
2. Click "SQL Editor"
3. Click "New query"
4. Copy and paste from `backend/add_materials_table.sql`
5. Click "Run"

### Step 2: Create Storage Bucket for PDFs

1. In Supabase dashboard, click **"Storage"** (left sidebar)
2. Click **"Create a new bucket"**
3. Settings:
   - **Name**: `materials`
   - **Public bucket**: ✅ Check this (so PDFs are accessible)
4. Click **"Create bucket"**

### Step 3: How It Works

**Teachers can upload:**
- PDFs (lecture notes, slides)
- Text notes (typed directly)
- Links (to external resources)

**Each material has:**
- Title (e.g., "Week 3: Newton's Laws")
- Description (optional)
- File URL (stored in Supabase storage)
- Week number (optional, for organization)

**When generating stories:**
- The system fetches all materials for that classroom
- GPT-4 uses the material content to create contextually accurate stories
- Stories reflect what was actually taught in class

## Simple API Endpoints (to implement)

```python
# Upload material
POST /api/classrooms/{classroom_id}/materials
Body: {
  "title": "Week 3: Newton's Laws",
  "description": "Lecture notes on forces and motion",
  "file": <PDF file>,
  "week_number": 3
}

# Get all materials for classroom
GET /api/classrooms/{classroom_id}/materials

# Get materials for specific week
GET /api/classrooms/{classroom_id}/materials?week={week_number}

# Delete material
DELETE /api/materials/{material_id}
```

## MVP Flow for Story Generation

**Before (original):**
```
Teacher inputs: "Today we learned about Newton's Laws"
↓
GPT-4 generates story based only on this prompt
```

**After (with materials):**
```
Teacher inputs: "Today we learned about Newton's Laws"
↓
System fetches: Week 3 materials (PDFs, notes)
↓
System extracts: Key concepts from materials
↓
GPT-4 generates story using actual lecture content
↓
More accurate, contextual stories!
```

## Quick Implementation

For MVP, you can:

1. **Simple text extraction from PDFs** (use PyPDF2)
2. **Pass material text to GPT-4** in the story generation prompt
3. **No fancy processing needed** - just concatenate material content

Example prompt enhancement:
```python
prompt = f"""
Create a story for {classroom.grade_level} students about {lesson_prompt}.

Context from class materials:
{material_content}

Generate a 20-panel comic story...
"""
```

## Database Schema

```sql
materials
├── id (UUID)
├── classroom_id (FK to classrooms)
├── title (TEXT)
├── description (TEXT, optional)
├── file_url (TEXT) -- URL to PDF in Supabase storage
├── file_type (TEXT) -- 'pdf', 'text', 'link'
├── week_number (INTEGER, optional)
└── created_at (TIMESTAMP)
```

## Next Steps

1. ✅ Run the SQL to create materials table
2. ✅ Create storage bucket in Supabase
3. 🔨 Implement upload endpoint in FastAPI
4. 🔨 Add material fetching to story generation
5. 🔨 Build simple upload UI for teachers

**This is the fastest way to add materials support for your hackathon MVP!** 🚀
