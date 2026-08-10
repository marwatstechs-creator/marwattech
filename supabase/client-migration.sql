-- ═══════════════════════════════════════════════════════════════════════
-- Client Portal — migration
-- Run this AFTER supabase/schema.sql to add client-facing features.
-- ═══════════════════════════════════════════════════════════════════════

-- Add 'client' role to the enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'client';

-- ── Client Projects ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Payments ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.client_projects (id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  method text,
  transaction_id text,
  description text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Invoices ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.client_projects (id) ON DELETE SET NULL,
  invoice_number text NOT NULL UNIQUE,
  amount numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Courses ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  cover_image text,
  category text,
  difficulty text DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_hours numeric(5, 1),
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Course Lessons ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses (id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content text,
  video_url text,
  sort_order integer NOT NULL DEFAULT 0,
  duration_minutes integer,
  is_free_preview boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, slug)
);

-- ── Enrollments ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  course_id uuid REFERENCES public.courses (id) ON DELETE CASCADE NOT NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (client_id, course_id)
);

-- ── Lesson Progress ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE NOT NULL,
  lesson_id uuid REFERENCES public.course_lessons (id) ON DELETE CASCADE NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE (client_id, lesson_id)
);

-- ── Study Materials (downloads/documents) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.study_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  category text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Triggers ────────────────────────────────────────────────────────────
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.client_projects
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.courses
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Client Portal
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Clients read their own projects
DROP POLICY IF EXISTS "clients_read_own_projects" ON public.client_projects;
CREATE POLICY "clients_read_own_projects" ON public.client_projects
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff());

-- Staff manages all projects
DROP POLICY IF EXISTS "staff_manage_projects" ON public.client_projects;
CREATE POLICY "staff_manage_projects" ON public.client_projects
  FOR ALL USING (public.is_staff());

-- Clients read their own payments
DROP POLICY IF EXISTS "clients_read_own_payments" ON public.payments;
CREATE POLICY "clients_read_own_payments" ON public.payments
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "staff_manage_payments" ON public.payments;
CREATE POLICY "staff_manage_payments" ON public.payments
  FOR ALL USING (public.is_staff());

-- Clients read their own invoices
DROP POLICY IF EXISTS "clients_read_own_invoices" ON public.invoices;
CREATE POLICY "clients_read_own_invoices" ON public.invoices
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "staff_manage_invoices" ON public.invoices;
CREATE POLICY "staff_manage_invoices" ON public.invoices
  FOR ALL USING (public.is_staff());

-- Clients & public read published courses
DROP POLICY IF EXISTS "courses_read_published" ON public.courses;
CREATE POLICY "courses_read_published" ON public.courses
  FOR SELECT USING (is_published = true OR public.is_staff());

DROP POLICY IF EXISTS "staff_manage_courses" ON public.courses;
CREATE POLICY "staff_manage_courses" ON public.courses
  FOR ALL USING (public.is_staff());

-- Lessons: read if course is published or staff
DROP POLICY IF EXISTS "lessons_read" ON public.course_lessons;
CREATE POLICY "lessons_read" ON public.course_lessons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND (c.is_published = true OR public.is_staff()))
  );

DROP POLICY IF EXISTS "staff_manage_lessons" ON public.course_lessons;
CREATE POLICY "staff_manage_lessons" ON public.course_lessons
  FOR ALL USING (public.is_staff());

-- Clients read their own enrollments
DROP POLICY IF EXISTS "clients_read_own_enrollments" ON public.enrollments;
CREATE POLICY "clients_read_own_enrollments" ON public.enrollments
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "staff_manage_enrollments" ON public.enrollments;
CREATE POLICY "staff_manage_enrollments" ON public.enrollments
  FOR ALL USING (public.is_staff());

-- Clients CRUD their lesson progress
DROP POLICY IF EXISTS "clients_manage_own_progress" ON public.lesson_progress;
CREATE POLICY "clients_manage_own_progress" ON public.lesson_progress
  FOR ALL USING (client_id = auth.uid());

DROP POLICY IF EXISTS "staff_read_progress" ON public.lesson_progress;
CREATE POLICY "staff_read_progress" ON public.lesson_progress
  FOR SELECT USING (public.is_staff());

-- Published study materials visible to all authenticated
DROP POLICY IF EXISTS "materials_read_published" ON public.study_materials;
CREATE POLICY "materials_read_published" ON public.study_materials
  FOR SELECT USING (is_published = true OR public.is_staff());

DROP POLICY IF EXISTS "staff_manage_materials" ON public.study_materials;
CREATE POLICY "staff_manage_materials" ON public.study_materials
  FOR ALL USING (public.is_staff());

-- ── Indexes ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_client_projects_client ON public.client_projects (client_id);
CREATE INDEX IF NOT EXISTS idx_payments_client ON public.payments (client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON public.invoices (client_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_client ON public.enrollments (client_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_client ON public.lesson_progress (client_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON public.lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON public.course_lessons (course_id, sort_order);
