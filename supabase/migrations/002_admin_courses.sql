-- ============================================================
-- Migration 002: Admin-managed Courses & Lessons
-- Run this AFTER migration 001 in your Supabase SQL Editor
-- ============================================================

-- Courses managed by admin (separate from static built-in courses)
CREATE TABLE IF NOT EXISTS public.db_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'internal-processes'
    CHECK (category IN ('internal-processes','technical-skills','sales-softskills','ai-technology')),
  level TEXT NOT NULL DEFAULT 'beginner'
    CHECK (level IN ('beginner','intermediate','advanced')),
  emoji TEXT NOT NULL DEFAULT '📚',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES public.profiles ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lessons belonging to db_courses
CREATE TABLE IF NOT EXISTS public.db_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.db_courses ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.db_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_lessons ENABLE ROW LEVEL SECURITY;

-- Published courses visible to all authenticated users
CREATE POLICY "Anyone can view published courses" ON public.db_courses
  FOR SELECT USING (is_published = true OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admins can manage courses
CREATE POLICY "Admins manage courses" ON public.db_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Lessons visible if parent course is visible
CREATE POLICY "Anyone can view lessons of published courses" ON public.db_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.db_courses
      WHERE id = course_id AND (is_published = true OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    )
  );

CREATE POLICY "Admins manage lessons" ON public.db_lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Admin can also update ALL profiles (for role/dept changes)
-- ============================================================

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_db_courses_updated_at
  BEFORE UPDATE ON public.db_courses
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_db_lessons_updated_at
  BEFORE UPDATE ON public.db_lessons
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
