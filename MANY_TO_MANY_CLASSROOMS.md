# Many-to-Many Classrooms Implementation ✅

## Problem Solved

Students can now join **multiple classrooms** instead of being limited to one!

## Database Changes

### Old Schema (One-to-Many)
```
students table:
- classroom_id → Can only be in ONE classroom
```

### New Schema (Many-to-Many)
```
students table:
- classroom_id → DEPRECATED (kept for backward compatibility)

student_classrooms table (NEW):
- student_id → References students
- classroom_id → References classrooms
- joined_at → When they joined
- UNIQUE(student_id, classroom_id) → No duplicates
```

## Migration Required

**Run this SQL in Supabase SQL Editor:**

```sql
-- Create junction table
CREATE TABLE student_classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, classroom_id)
);

-- Create indexes
CREATE INDEX idx_student_classrooms_student ON student_classrooms(student_id);
CREATE INDEX idx_student_classrooms_classroom ON student_classrooms(classroom_id);

-- Migrate existing data
INSERT INTO student_classrooms (student_id, classroom_id, joined_at)
SELECT id, classroom_id, created_at
FROM students
WHERE classroom_id IS NOT NULL;

-- Mark old column as deprecated
COMMENT ON COLUMN students.classroom_id IS 'DEPRECATED - Use student_classrooms table instead';
```

## New Features

### 1. Students Can Join Multiple Classrooms
```
Emma → Physics 101
Emma → Math Advanced
Emma → Chemistry Lab
```

### 2. Check Enrollment
```
Is Emma in Physics 101? → Yes
Is Emma in History? → No
```

### 3. Leave Classrooms
```
Emma leaves Math Advanced
Emma still in Physics 101 ✓
```

## API Changes

### New Endpoints

#### GET /students/{student_id}
**Changed:** Now returns ALL classrooms

**Response:**
```json
{
  "success": true,
  "student": { ... },
  "classrooms": [
    {
      "id": "uuid-1",
      "name": "Physics 101",
      ...
    },
    {
      "id": "uuid-2",
      "name": "Math Advanced",
      ...
    }
  ]
}
```

#### GET /students/{student_id}/classrooms
**New:** Get all classrooms for a student

**Response:**
```json
{
  "success": true,
  "classrooms": [ ... ]
}
```

#### POST /students/{student_id}/join-classroom/{classroom_id}
**Changed:** Uses junction table, prevents duplicates

**Response:**
```json
{
  "success": true,
  "message": "Student joined classroom successfully",
  "student": { ... },
  "classroom": { ... }
}
```

If already enrolled:
```json
{
  "success": true,
  "message": "Student already enrolled in this classroom",
  ...
}
```

#### DELETE /students/{student_id}/leave-classroom/{classroom_id}
**New:** Remove student from a classroom

**Response:**
```json
{
  "success": true,
  "message": "Student left classroom successfully"
}
```

### Updated Endpoints

#### GET /classrooms/{classroom_id}/students
**Changed:** Queries through junction table

Still returns same format:
```json
{
  "success": true,
  "students": [ ... ]
}
```

## Backend Functions

### New Database Functions

```python
# Add student to classroom
add_student_to_classroom(student_id, classroom_id)

# Remove student from classroom
remove_student_from_classroom(student_id, classroom_id)

# Get all classrooms for a student
get_classrooms_by_student(student_id)

# Check if student is in classroom
is_student_in_classroom(student_id, classroom_id)
```

### Updated Functions

```python
# Now queries through junction table
get_students_by_classroom(classroom_id)
```

## Frontend Changes

### API Client Updates

```typescript
// Get student with ALL classrooms
api.students.getById(studentId)
// Returns: { student, classrooms: [...] }

// Get just classrooms
api.students.getClassrooms(studentId)
// Returns: { classrooms: [...] }

// Join classroom (can join multiple)
api.students.joinClassroom(studentId, classroomId)

// Leave classroom
api.students.leaveClassroom(studentId, classroomId)
```

## User Flows

### Flow 1: Student Joins First Classroom

```
1. Student creates account
2. Clicks invite link for Physics 101
3. Joins Physics 101
4. Dashboard shows: "Physics 101"
```

### Flow 2: Student Joins Second Classroom

```
1. Student already in Physics 101
2. Clicks invite link for Math Advanced
3. Joins Math Advanced
4. Dashboard shows: "Physics 101", "Math Advanced"
```

### Flow 3: Student Leaves Classroom

```
1. Student in Physics 101 and Math Advanced
2. Leaves Math Advanced
3. Dashboard shows: "Physics 101"
4. Still has access to Physics 101 stories
```

## Database Queries

### Get All Students in a Classroom
```sql
SELECT s.*
FROM students s
JOIN student_classrooms sc ON s.id = sc.student_id
WHERE sc.classroom_id = 'classroom-uuid';
```

### Get All Classrooms for a Student
```sql
SELECT c.*
FROM classrooms c
JOIN student_classrooms sc ON c.id = sc.classroom_id
WHERE sc.student_id = 'student-uuid';
```

### Check Enrollment
```sql
SELECT EXISTS (
  SELECT 1 FROM student_classrooms
  WHERE student_id = 'student-uuid'
  AND classroom_id = 'classroom-uuid'
);
```

## Benefits

### For Students
- ✅ Join multiple classes
- ✅ Access stories from all classes
- ✅ One account for everything
- ✅ Leave classes without losing others

### For Teachers
- ✅ Share students across classes
- ✅ Collaborative teaching
- ✅ Students keep same avatar
- ✅ Track enrollment history

### For System
- ✅ Proper database design
- ✅ No data duplication
- ✅ Scalable architecture
- ✅ Easy to query

## Migration Steps

1. **Run SQL migration** in Supabase
2. **Restart backend** (if needed)
3. **Test existing students** - should still work
4. **Test joining multiple classrooms**

## Testing

### Test 1: Existing Students

```bash
# Get student (should show their classroom)
curl http://localhost:8000/students/{student_id}
```

Should return classrooms array with their existing classroom.

### Test 2: Join Second Classroom

```bash
# Join another classroom
curl -X POST http://localhost:8000/students/{student_id}/join-classroom/{classroom_id_2}
```

Should succeed.

### Test 3: Get All Classrooms

```bash
# Get all classrooms for student
curl http://localhost:8000/students/{student_id}/classrooms
```

Should return multiple classrooms.

### Test 4: Leave Classroom

```bash
# Leave a classroom
curl -X DELETE http://localhost:8000/students/{student_id}/leave-classroom/{classroom_id}
```

Should succeed, student still in other classrooms.

## Backward Compatibility

- ✅ Old `classroom_id` column still exists (deprecated)
- ✅ Existing data migrated to junction table
- ✅ Old queries still work
- ✅ Can remove `classroom_id` column later if needed

## Files Modified

### Backend
- `backend/src/database/database.py`
  - Updated `get_students_by_classroom()`
  - Added `add_student_to_classroom()`
  - Added `remove_student_from_classroom()`
  - Added `get_classrooms_by_student()`
  - Added `is_student_in_classroom()`

- `backend/src/main.py`
  - Updated `POST /students/{student_id}/join-classroom/{classroom_id}`
  - Updated `GET /students/{student_id}`
  - Added `GET /students/{student_id}/classrooms`
  - Added `DELETE /students/{student_id}/leave-classroom/{classroom_id}`

### Frontend
- `frontend/src/lib/api.ts`
  - Updated `students.getById()` return type
  - Added `students.getClassrooms()`
  - Added `students.leaveClassroom()`

### Database
- `backend/src/database/migration_many_to_many_classrooms.sql`
  - New migration file

## Success! 🎉

Students can now join multiple classrooms and access stories from all of them!
