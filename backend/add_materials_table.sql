-- ============================================
-- ADD MATERIALS TABLE FOR LECTURE NOTES/PDFs
-- ============================================
-- Run this SQL in Supabase SQL Editor to add materials support

-- Materials table (for PDFs, notes, etc.)
CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,  -- 'pdf', 'text', 'link'
    week_number INTEGER,  -- Optional: which week this material is for
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_materials_classroom ON materials(classroom_id);
CREATE INDEX idx_materials_week ON materials(classroom_id, week_number);

-- Comment
COMMENT ON TABLE materials IS 'Lecture notes, PDFs, and materials uploaded by teachers';
