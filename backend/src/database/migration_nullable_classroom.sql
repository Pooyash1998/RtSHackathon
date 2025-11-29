-- ============================================
-- MIGRATION: Make classroom_id nullable for students
-- ============================================
-- This allows students to create accounts before joining a classroom

-- Remove NOT NULL constraint from classroom_id
ALTER TABLE students 
ALTER COLUMN classroom_id DROP NOT NULL;

-- Update the foreign key to allow NULL
-- (The existing foreign key already allows NULL values once the column is nullable)

-- Add comment explaining the change
COMMENT ON COLUMN students.classroom_id IS 'Classroom the student belongs to (NULL if not yet joined)';
