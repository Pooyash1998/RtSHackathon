# Remove "Include Dialogue" Option from PDF Export

## Rationale
Comics inherently contain dialogue as part of the panel images (speech bubbles, captions, etc.). Having an option to "include" or "exclude" dialogue doesn't make sense because:

1. **Dialogue is baked into the images** - The comic panels are generated with dialogue already rendered as speech bubbles
2. **No separate text layer** - There's no separate text layer to toggle on/off
3. **Confusing UX** - Users might think they can remove dialogue, but they can't
4. **Unnecessary complexity** - Adds an option that doesn't provide any real functionality

## Changes Made

### 1. Frontend (`frontend/src/pages/teacher/StoryViewer.tsx`)

**Removed from state:**
```typescript
// BEFORE
const [exportSettings, setExportSettings] = useState({
  pageSize: "a4",
  layout: "2",
  includeDialogue: "yes"  // ❌ Removed
});

// AFTER
const [exportSettings, setExportSettings] = useState({
  pageSize: "a4",
  layout: "2"
});
```

**Removed from UI:**
- Removed the entire "Include Dialogue" radio group section from the export dialog
- Dialog now only shows:
  - Page Size (A4 / Letter)
  - Layout (2 / 4 panels per page)

### 2. Design Spec (`.kiro/specs/classroom-story-platform/design.md`)

**Updated ExportPDFRequest model:**
```python
# BEFORE
class ExportPDFRequest(BaseModel):
    page_size: Literal["a4", "letter"] = "a4"
    layout: Literal["2", "4"] = "2"
    include_dialogue: bool = True  # ❌ Removed

# AFTER
class ExportPDFRequest(BaseModel):
    page_size: Literal["a4", "letter"] = "a4"
    layout: Literal["2", "4"] = "2"
```

**Updated router signature:**
```python
# BEFORE
@router.get("/api/stories/{story_id}/export/pdf")
async def export_pdf_download(
    story_id: str,
    page_size: Literal["a4", "letter"] = "a4",
    layout: Literal["2", "4"] = "2",
    include_dialogue: bool = True  # ❌ Removed
) -> FileResponse

# AFTER
@router.get("/api/stories/{story_id}/export/pdf")
async def export_pdf_download(
    story_id: str,
    page_size: Literal["a4", "letter"] = "a4",
    layout: Literal["2", "4"] = "2"
) -> FileResponse
```

## Result

The PDF export dialog is now cleaner and more focused:

```
┌─────────────────────────────────┐
│ Export as PDF                   │
├─────────────────────────────────┤
│                                 │
│ Page Size                       │
│ ○ A4                           │
│ ○ Letter                       │
│                                 │
│ Layout                          │
│ ○ 2 panels per page            │
│ ○ 4 panels per page            │
│                                 │
│ [Download PDF]                  │
└─────────────────────────────────┘
```

## Files Modified

1. `frontend/src/pages/teacher/StoryViewer.tsx` - Removed dialogue option from state and UI
2. `.kiro/specs/classroom-story-platform/design.md` - Updated API models and router signatures
3. `PDF_EXPORT_FIX_APPLIED.md` - Updated documentation

## Testing

1. Open StoryViewer
2. Click "Export PDF"
3. Verify the dialog only shows:
   - Page Size options
   - Layout options
   - Download button
4. Export should work normally with dialogue always included in the comic images
