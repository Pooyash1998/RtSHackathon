# Story Generation Workflow - Complete Implementation

## Overview
Implemented the complete story generation workflow where teachers:
1. Enter lesson prompt
2. Get 3 AI-generated story options
3. Choose one option
4. System saves the choice to database

## Database Schema Used

### Chapters Table
```sql
CREATE TABLE public.chapters (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id uuid NOT NULL REFERENCES classrooms(id),
    index integer NOT NULL CHECK (index >= 1),
    original_prompt text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    story_ideas jsonb,
    chosen_idea_id text,
    status text DEFAULT 'draft',
    story_script jsonb
);
```

**Key Fields**:
- `original_prompt`: Teacher's lesson description
- `story_ideas`: Array of 3 generated story options (JSON)
- `chosen_idea_id`: ID of the story teacher selected
- `status`: Workflow status (draft → options_generated → idea_chosen → complete)

## Backend Implementation

### 1. Start Chapter Endpoint

**POST** `/classrooms/{classroom_id}/chapters/start?lesson_prompt={prompt}`

**Process**:
1. Gets next chapter index for classroom
2. Calls AI to generate 3 story options
3. Creates chapter record with:
   - `original_prompt`: Teacher's input
   - `story_ideas`: Generated options
   - `status`: "options_generated"
4. Returns chapter with story options

**Response**:
```json
{
  "success": true,
  "chapter": {
    "id": "chapter-uuid",
    "classroom_id": "classroom-uuid",
    "index": 1,
    "original_prompt": "Newton's Laws of Motion...",
    "story_ideas": [
      {
        "id": "idea_1",
        "title": "Newton's Space Race",
        "summary": "...",
        "theme": "🚀"
      },
      ...
    ],
    "chosen_idea_id": null,
    "status": "options_generated"
  }
}
```

### 2. Choose Idea Endpoint

**POST** `/chapters/{chapter_id}/choose-idea?idea_id={id}`

**Process**:
1. Verifies chapter exists
2. Updates chapter with:
   - `chosen_idea_id`: Selected story ID
   - `status`: "idea_chosen"
3. Returns updated chapter

**Response**:
```json
{
  "success": true,
  "chapter": {
    "id": "chapter-uuid",
    "chosen_idea_id": "idea_2",
    "status": "idea_chosen",
    ...
  }
}
```

## Frontend Implementation

### Story Generator Page

**Location**: `frontend/src/pages/teacher/StoryGenerator.tsx`

#### Step 1: Enter Lesson Prompt
- Teacher enters what they taught
- Max 500 characters
- Click "Generate Story Options"

#### Step 2: Choose Story
- Shows 3 AI-generated story options
- Each card shows:
  - Theme emoji
  - Title
  - Summary
- Teacher clicks "Select This Story"

#### Step 3: Generating (Simulated)
- Shows progress bar
- Simulates panel generation
- Saves chosen idea to database
- Navigates back to classroom

### API Client Updates

**Added to** `frontend/src/lib/api.ts`:

```typescript
story: {
  startChapter: (classroomId, lessonPrompt) => {...},
  chooseIdea: (chapterId, ideaId) => {...}
}
```

## Complete Workflow

```
1. Teacher clicks "Generate New Story"
   ↓
2. Enters lesson prompt
   ↓
3. Clicks "Generate Story Options"
   ↓
4. Backend creates chapter record
   ↓
5. AI generates 3 story options
   ↓
6. Options saved to chapter.story_ideas (JSON)
   ↓
7. Teacher sees 3 story cards
   ↓
8. Teacher selects one
   ↓
9. Backend updates chapter.chosen_idea_id
   ↓
10. Backend updates chapter.status = "idea_chosen"
   ↓
11. Teacher redirected to classroom
   ↓
12. Chapter appears in Stories tab ✅
```

## Database State Flow

### After Step 1 (Generate Options):
```json
{
  "id": "chapter-uuid",
  "classroom_id": "classroom-uuid",
  "index": 1,
  "original_prompt": "Today we covered Newton's Laws...",
  "story_ideas": [
    {"id": "idea_1", "title": "...", ...},
    {"id": "idea_2", "title": "...", ...},
    {"id": "idea_3", "title": "...", ...}
  ],
  "chosen_idea_id": null,
  "status": "options_generated"
}
```

### After Step 2 (Choose Idea):
```json
{
  "id": "chapter-uuid",
  "classroom_id": "classroom-uuid",
  "index": 1,
  "original_prompt": "Today we covered Newton's Laws...",
  "story_ideas": [...],
  "chosen_idea_id": "idea_2",  // ← Updated
  "status": "idea_chosen"       // ← Updated
}
```

## Story Options Format

Each story option has:
```typescript
{
  id: string;        // "idea_1", "idea_2", "idea_3"
  title: string;     // "Newton's Space Race"
  summary: string;   // Full description
  theme: string;     // Emoji like "🚀"
}
```

## Next Steps in Workflow

After teacher chooses a story, the next phase would be:
1. Generate full script with panels
2. Generate images for each panel
3. Save panels to database
4. Mark chapter as "complete"

This is handled by the `comic_creation.py` service (already exists).

## Testing

### Test Story Generation:
1. Go to classroom → Stories tab
2. Click "Generate New Story"
3. Enter: "Today we covered Newton's Laws of Motion"
4. Click "Generate Story Options"
5. **Expected**: See 3 story options
6. Click "Select This Story" on one
7. **Expected**: Progress bar, then redirect to classroom
8. **Expected**: New chapter appears in Stories tab

### Verify Database:
```sql
-- Check chapter was created
SELECT id, index, original_prompt, chosen_idea_id, status
FROM chapters
WHERE classroom_id = 'your-classroom-id'
ORDER BY created_at DESC
LIMIT 1;

-- Check story_ideas JSON
SELECT story_ideas
FROM chapters
WHERE id = 'your-chapter-id';
```

## Benefits

### ✅ Complete Workflow
- Teacher input → AI generation → Selection → Database
- All steps tracked in database
- Can resume or review later

### ✅ Flexible
- Story options stored as JSON
- Can add more fields later
- Status tracking for workflow

### ✅ User-Friendly
- Clear 3-step process
- Visual story cards
- Progress feedback

### ✅ Database-Driven
- All data persisted
- Can query story history
- Can analyze popular story types

## Future Enhancements

### Optional Features:
1. **Regenerate options**: Let teacher get new options
2. **Edit prompt**: Go back and modify lesson prompt
3. **Preview**: Show more details before choosing
4. **Save for later**: Save options without choosing
5. **History**: View all generated options
6. **Analytics**: Track which story types are popular
7. **Custom options**: Let teacher write their own story
8. **Combine ideas**: Mix elements from multiple options

## Summary

Teachers can now:
- ✅ Enter lesson prompts
- ✅ Get AI-generated story options
- ✅ Choose their favorite option
- ✅ System saves everything to database
- ✅ Chapter appears in classroom with chosen story

The workflow is complete and ready for the next phase (generating actual comic panels)! 🎉
