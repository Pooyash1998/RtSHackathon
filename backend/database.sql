-- ============================================
-- CLASSROOM STORY PLATFORM - DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor

-- Classrooms table
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    story_theme TEXT NOT NULL,
    design_style TEXT NOT NULL CHECK (design_style IN ('manga', 'comic', 'cartoon')),
    duration TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    interests TEXT NOT NULL,
    avatar_url TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stories table
CREATE TABLE stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    lesson_prompt TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('generating', 'completed', 'failed', 'regenerating')),
    progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Panels table
CREATE TABLE panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    panel_number INTEGER NOT NULL CHECK (panel_number >= 1 AND panel_number <= 20),
    image_url TEXT NOT NULL,
    dialogue TEXT NOT NULL,
    scene_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(story_id, panel_number)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_classroom ON students(classroom_id);
CREATE INDEX idx_stories_classroom ON stories(classroom_id);
CREATE INDEX idx_stories_status ON stories(status);
CREATE INDEX idx_panels_story ON panels(story_id);
CREATE INDEX idx_panels_story_number ON panels(story_id, panel_number);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE classrooms IS 'Virtual classrooms created by teachers';
COMMENT ON TABLE students IS 'Students who join classrooms and appear in stories';
COMMENT ON TABLE stories IS 'AI-generated comic stories based on lesson content';
COMMENT ON TABLE panels IS 'Individual comic panels (20 per story)';

COMMENT ON COLUMN classrooms.design_style IS 'Visual style: manga, comic, or cartoon';
COMMENT ON COLUMN students.avatar_url IS 'FLUX-generated character avatar';
COMMENT ON COLUMN students.photo_url IS 'Optional uploaded student photo';
COMMENT ON COLUMN stories.status IS 'Generation status: generating, completed, failed, regenerating';
COMMENT ON COLUMN stories.progress IS 'Generation progress: 0-100';
COMMENT ON COLUMN panels.panel_number IS 'Sequential panel number: 1-20';
