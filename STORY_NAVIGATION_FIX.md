# Story Navigation Fix - Previous/Next Story Buttons

## Problem
The "Previous Story" and "Next Story" buttons in the StoryViewer component were not functional - they had no onClick handlers and didn't navigate between stories.

## Solution Implemented

### 1. Load All Chapters for Navigation Context
When a chapter is loaded, we now also fetch all chapters for that classroom to enable navigation:

```typescript
// Load all chapters for this classroom to enable navigation
if (response.chapter.classroom_id) {
  const chaptersResponse = await api.classrooms.getChapters(response.chapter.classroom_id);
  if (chaptersResponse.success && chaptersResponse.chapters) {
    // Sort chapters by created_at descending (newest first)
    const sortedChapters = [...chaptersResponse.chapters].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setAllChapters(sortedChapters);
    
    // Find current chapter index
    const index = sortedChapters.findIndex(ch => ch.id === id);
    setCurrentIndex(index);
  }
}
```

### 2. Added State Management
```typescript
const [allChapters, setAllChapters] = useState<any[]>([]);
const [currentIndex, setCurrentIndex] = useState<number>(-1);
```

### 3. Implemented Navigation Logic
The buttons now:
- Navigate to the previous/next chapter in the sorted list
- Are disabled when at the beginning/end of the list
- Only show when there are multiple chapters available

```typescript
{allChapters.length > 1 && (
  <div className="flex justify-between pt-8 border-t">
    <Button 
      variant="outline"
      onClick={() => {
        if (currentIndex < allChapters.length - 1) {
          navigate(`/teacher/story/${allChapters[currentIndex + 1].id}`);
        }
      }}
      disabled={currentIndex === -1 || currentIndex >= allChapters.length - 1}
    >
      <ChevronLeft className="w-4 h-4 mr-2" />
      Previous Story
    </Button>
    <Button 
      variant="outline"
      onClick={() => {
        if (currentIndex > 0) {
          navigate(`/teacher/story/${allChapters[currentIndex - 1].id}`);
        }
      }}
      disabled={currentIndex === -1 || currentIndex <= 0}
    >
      Next Story
      <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
    </Button>
  </div>
)}
```

## Navigation Behavior

### Story Order
Stories are sorted by **creation date descending** (newest first):
- **Index 0**: Most recent story
- **Index 1**: Second most recent
- **Index N**: Oldest story

### Button Logic
- **Previous Story**: Goes to the next index (older story)
  - Disabled when at the last (oldest) story
- **Next Story**: Goes to the previous index (newer story)
  - Disabled when at the first (newest) story

### Visual States
- **Enabled**: Button is clickable, normal appearance
- **Disabled**: Button is grayed out, not clickable
- **Hidden**: Navigation section doesn't show if only 1 story exists

## Example Scenarios

### Scenario 1: Viewing Newest Story
```
Current: Story A (index 0, newest)
Stories: [A, B, C]

Previous Story: Enabled → Goes to Story B
Next Story: Disabled (already at newest)
```

### Scenario 2: Viewing Middle Story
```
Current: Story B (index 1)
Stories: [A, B, C]

Previous Story: Enabled → Goes to Story C
Next Story: Enabled → Goes to Story A
```

### Scenario 3: Viewing Oldest Story
```
Current: Story C (index 2, oldest)
Stories: [A, B, C]

Previous Story: Disabled (already at oldest)
Next Story: Enabled → Goes to Story B
```

### Scenario 4: Only One Story
```
Current: Story A (index 0)
Stories: [A]

Navigation section: Hidden (not shown)
```

## User Experience Improvements

### Before
- ❌ Buttons present but non-functional
- ❌ No way to navigate between stories
- ❌ Had to go back to classroom and select another story

### After
- ✅ Buttons work and navigate between stories
- ✅ Disabled state when at boundaries
- ✅ Hidden when only one story exists
- ✅ Smooth navigation without leaving the viewer
- ✅ Maintains context within the classroom

## Technical Details

### API Used
- `api.chapters.getById(id)` - Get current chapter details
- `api.classrooms.getChapters(classroomId)` - Get all chapters for navigation

### Route Pattern
- Current route: `/teacher/story/:id`
- Navigation uses: `navigate(\`/teacher/story/${nextChapterId}\`)`

### React Hooks
- `useParams()` - Get current chapter ID from URL
- `useNavigate()` - Navigate to different chapters
- `useEffect()` - Load data when chapter ID changes
- `useState()` - Manage chapters list and current index

## Testing Checklist

- [x] Load a story from a classroom with multiple stories
- [x] Verify navigation buttons appear
- [x] Click "Previous Story" - should go to older story
- [x] Click "Next Story" - should go to newer story
- [x] Navigate to oldest story - "Previous" should be disabled
- [x] Navigate to newest story - "Next" should be disabled
- [x] Load a story from a classroom with only one story - navigation should be hidden
- [x] Verify chapter data loads correctly after navigation

## Files Modified

- `frontend/src/pages/teacher/StoryViewer.tsx` - Added navigation logic and handlers

## Future Enhancements

### 1. Keyboard Navigation
Add keyboard shortcuts for navigation:
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && currentIndex < allChapters.length - 1) {
      navigate(`/teacher/story/${allChapters[currentIndex + 1].id}`);
    } else if (e.key === 'ArrowRight' && currentIndex > 0) {
      navigate(`/teacher/story/${allChapters[currentIndex - 1].id}`);
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [currentIndex, allChapters, navigate]);
```

### 2. Story Indicator
Show current position in the list:
```typescript
<div className="text-center text-sm text-muted-foreground">
  Story {currentIndex + 1} of {allChapters.length}
</div>
```

### 3. Story Thumbnails
Add a thumbnail strip for quick navigation:
```typescript
<div className="flex gap-2 justify-center">
  {allChapters.map((ch, idx) => (
    <button
      key={ch.id}
      onClick={() => navigate(`/teacher/story/${ch.id}`)}
      className={idx === currentIndex ? 'border-2 border-primary' : ''}
    >
      <img src={ch.thumbnail} alt={`Story ${idx + 1}`} />
    </button>
  ))}
</div>
```

### 4. Preload Adjacent Stories
Preload next/previous stories for faster navigation:
```typescript
useEffect(() => {
  if (currentIndex > 0) {
    // Preload next story
    api.chapters.getById(allChapters[currentIndex - 1].id);
  }
  if (currentIndex < allChapters.length - 1) {
    // Preload previous story
    api.chapters.getById(allChapters[currentIndex + 1].id);
  }
}, [currentIndex, allChapters]);
```

## Summary

The story navigation is now fully functional! Teachers can easily browse through all stories in a classroom using the Previous/Next buttons, with proper disabled states and smart visibility based on the number of available stories.
