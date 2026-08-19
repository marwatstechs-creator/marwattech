-- Get-Started meeting bookings (mirrors the rocketdevs.com/get-started flow).
-- Anyone can book a strategy/discovery call; staff can read/update/delete and
-- manage each meeting through the admin Meetings dashboard.

-- 1) Dedicated status enum for meeting lifecycle.
do $$ begin
  create type public.meeting_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

-- 2) Meeting bookings table.
create table if not exists public.meeting_bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  country text,
  company text,
  project_description text not null,
  tech_stack text,
  how_found text,
  timezone text not null default 'Asia/Karachi',
  meeting_date date not null,
  meeting_time text not null,
  status public.meeting_status not null default 'pending',
  meeting_link text,
  internal_notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_meeting_bookings_status on public.meeting_bookings (status);
create index if not exists idx_meeting_bookings_created on public.meeting_bookings (created_at desc);

-- 3) RLS: public insert, staff read/update/delete.
alter table public.meeting_bookings enable row level security;

drop policy if exists "meeting_bookings_insert_public" on public.meeting_bookings;
create policy "meeting_bookings_insert_public" on public.meeting_bookings
  for insert with check (true);

drop policy if exists "meeting_bookings_staff_read" on public.meeting_bookings;
create policy "meeting_bookings_staff_read" on public.meeting_bookings
  for select using (public.is_staff());

drop policy if exists "meeting_bookings_staff_update" on public.meeting_bookings;
create policy "meeting_bookings_staff_update" on public.meeting_bookings
  for update using (public.is_staff());

drop policy if exists "meeting_bookings_staff_delete" on public.meeting_bookings;
create policy "meeting_bookings_staff_delete" on public.meeting_bookings
  for delete using (public.is_staff());
