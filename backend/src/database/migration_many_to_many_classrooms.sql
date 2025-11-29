-- ============================================
-- MIGRATION: Many-to-Many Relationship for Students and Classrooms
-- ============================================
-- This allows students to be in multiple classrooms

-- Step 1: Create junction table for student-classroom relationships
CREATE TABLE student_classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, classroom_id)  -- Prevent duplicate enrollments
);

-- Step 2: Create indexes for performance
CREATE INDEX idx_student_classrooms_student ON student_classrooms(student_id);
CREATE INDEX idx_student_classrooms_classroom ON student_classrooms(classroom_id);

-- Step 3: Migrate existing data from students.classroom_id to junction table
-- This preserves existing student-classroom relationships
INSERT INTO student_classrooms (student_id, classroom_id, joined_at)
SELECT id, classroom_id, created_at
FROM students
WHERE classroom_id IS NOT NULL;

-- Step 4: Remove classroom_id column from students table
-- (Keep it for now as backup, or drop it if you're confident)
-- ALTER TABLE students DROP COLUMN classroom_id;
-- For safety, let's just make it clear it's deprecated:
COMMENT ON COLUMN students.classroom_id IS 'DEPRECATED - Use student_classrooms table instead';

-- Step 5: Add comments for documentation
COMMENT ON TABLE student_classrooms IS 'Junction table for many-to-many relationship between students and classrooms';
COMMENT ON COLUMN student_classrooms.student_id IS 'Reference to the student';
COMMENT ON COLUMN student_classrooms.classroom_id IS 'Reference to the classroom';
COMMENT ON COLUMN student_classrooms.joined_at IS 'When the student joined this classroom';

-- Step 6: Verify migration
SELECT 
    'Migration complete!' as status,
    COUNT(*) as total_enrollments
FROM student_classrooms;
