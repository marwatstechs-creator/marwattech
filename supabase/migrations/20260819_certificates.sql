-- ── Course Completion Certificates ──────────────────────────────────────
-- Issued automatically when a client completes a course. Publicly viewable
-- and verifiable by verification_code.

create sequence if not exists public.certificates_no_seq;

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_no text not null unique,          -- e.g. CERT-2026-000001
  verification_code text not null unique,       -- e.g. 8F7K2P9X
  student_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  student_name text not null,
  course_title text not null,
  course_category text,
  instructor_name text,
  course_duration text,
  status text not null default 'locked'
    check (status in ('locked', 'eligible', 'issued', 'revoked')),
  issue_date date,
  completion_date date,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists certificates_student_idx on public.certificates(student_id);
create index if not exists certificates_course_idx on public.certificates(course_id);
create index if not exists certificates_code_idx on public.certificates(verification_code);
-- One active (non-revoked) certificate per student+course.
create unique index if not exists certificates_active_unique
  on public.certificates(student_id, course_id) where status <> 'revoked';

alter table public.certificates enable row level security;

-- Public read: issued certificates are viewable + verifiable by anyone.
create policy "certificates_public_read" on public.certificates
  for select using (status = 'issued');

-- Clients can read their own certificates (issued or not).
create policy "certificates_own_read" on public.certificates
  for select using (auth.uid() = student_id);

-- Clients can generate (insert) their own certificates.
create policy "certificates_own_insert" on public.certificates
  for insert with check (auth.uid() = student_id);

-- Staff can manage all certificates.
create policy "certificates_staff_all" on public.certificates
  for all using (is_staff())
  with check (is_staff());

-- Keep updated_at fresh.
create or replace function public.touch_certificates_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists certificates_updated_at on public.certificates;
create trigger certificates_updated_at
  before update on public.certificates
  for each row execute function public.touch_certificates_updated_at();
