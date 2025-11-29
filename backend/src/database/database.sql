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
    design_style TEXT NOT NULL CHECK (design_style IN ('manga', 'comic')),
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

-- Chapters table
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    index INTEGER NOT NULL CHECK (index >= 1),
    chapter_outline TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(classroom_id, index)
);

-- Panels table
CREATE TABLE panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    index INTEGER NOT NULL CHECK (index >= 1),
    image TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(chapter_id, index)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_students_classroom ON students(classroom_id);
CREATE INDEX idx_chapters_classroom ON chapters(classroom_id);
CREATE INDEX idx_chapters_classroom_index ON chapters(classroom_id, index);
CREATE INDEX idx_panels_chapter ON panels(chapter_id);
CREATE INDEX idx_panels_chapter_index ON panels(chapter_id, index);

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE classrooms IS 'Virtual classrooms created by teachers';
COMMENT ON TABLE students IS 'Students who join classrooms and appear in stories';
COMMENT ON TABLE chapters IS 'Chapters within a classroom story';
COMMENT ON TABLE panels IS 'Comic panels within each chapter';

COMMENT ON COLUMN classrooms.design_style IS 'Visual style: manga, comic, or cartoon';
COMMENT ON COLUMN students.avatar_url IS 'FLUX-generated character avatar';
COMMENT ON COLUMN students.photo_url IS 'Optional uploaded student photo';
COMMENT ON COLUMN chapters.index IS 'Sequential chapter number starting from 1';
COMMENT ON COLUMN chapters.chapter_outline IS 'Outline/description of the chapter content';
COMMENT ON COLUMN panels.index IS 'Sequential panel number within the chapter starting from 1';
COMMENT ON COLUMN panels.image IS 'URL of the panel image';