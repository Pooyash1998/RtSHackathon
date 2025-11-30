# Remove "MAIN" Text from Dashboard Sidebar

## Change Made

Removed the "Main" section header from the teacher dashboard sidebar.

### File Modified
`frontend/src/components/teacher/TeacherSidebar.tsx`

### Before
```tsx
{open && !isClassroomPage && (
  <div className="px-2 mb-2">
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      Main
    </h3>
  </div>
)}
```

### After
```tsx
// Section header removed - navigation links display directly
```

## Result

The sidebar now shows navigation links (Dashboard, Classrooms, etc.) without the "MAIN" label above them.

### Before:
```
┌─────────────┐
│ MAIN        │
│ Dashboard   │
│ Classrooms  │
└─────────────┘
```

### After:
```
┌─────────────┐
│ Dashboard   │
│ Classrooms  │
└─────────────┘
```

## Impact

- ✅ Cleaner sidebar appearance
- ✅ More space for navigation items
- ✅ Less visual clutter
- ✅ Simpler, more modern look

The navigation links are still fully functional, just without the "MAIN" section header.
