-- Add hours + seconds to lesson duration (minutes kept for backward compat).
ALTER TABLE public.course_lessons
  ADD COLUMN IF NOT EXISTS duration_hours integer CHECK (duration_hours >= 0),
  ADD COLUMN IF NOT EXISTS duration_seconds integer CHECK (duration_seconds >= 0);
