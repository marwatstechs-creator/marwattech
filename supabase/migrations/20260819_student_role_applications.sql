-- Student role + student applications
-- Restricts Courses & Study Materials to approved students only.

-- 1) Add the new role to the user_role enum.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'student';

-- 2) Applications table: a client requests to become a student; a staff
--    member approves/rejects. On approve, the profile role is set to 'student'.
create table if not exists public.student_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  full_name text,
  email text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);

create index if not exists student_applications_user_idx
  on public.student_applications(user_id);
create index if not exists student_applications_status_idx
  on public.student_applications(status);

alter table public.student_applications enable row level security;

-- A user can file their own application and read its status.
create policy "student_applications_insert_own"
  on public.student_applications for insert
  with check (auth.uid() = user_id);

create policy "student_applications_select_own"
  on public.student_applications for select
  using (auth.uid() = user_id);

-- Staff can read and update every application (approve/reject).
create policy "student_applications_select_staff"
  on public.student_applications for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'editor', 'support')
    )
  );

create policy "student_applications_update_staff"
  on public.student_applications for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'editor', 'support')
    )
  );
