-- University-style Study Material platform: Subject → Weeks → Slides

create table if not exists public.study_subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  instructor text,
  category text,
  color text,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger handle_updated_at before update on public.study_subjects
  for each row execute procedure moddatetime (updated_at);
alter table public.study_subjects enable row level security;
create policy "study_subjects_read_public" on public.study_subjects
  for select using (published = true or public.is_editor());
create policy "study_subjects_editor_write" on public.study_subjects
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_study_subjects_published on public.study_subjects (published, sort_order);

create table if not exists public.study_weeks (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.study_subjects(id) on delete cascade,
  week_number integer not null,
  title text not null,
  description text,
  pdf_url text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, week_number)
);
create trigger handle_updated_at before update on public.study_weeks
  for each row execute procedure moddatetime (updated_at);
alter table public.study_weeks enable row level security;
create policy "study_weeks_read_public" on public.study_weeks
  for select using (published = true or public.is_editor());
create policy "study_weeks_editor_write" on public.study_weeks
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_study_weeks_subject on public.study_weeks (subject_id, week_number);

create table if not exists public.study_slides (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.study_weeks(id) on delete cascade,
  slide_number integer not null,
  title text not null,
  content text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_id, slide_number)
);
create trigger handle_updated_at before update on public.study_slides
  for each row execute procedure moddatetime (updated_at);
alter table public.study_slides enable row level security;
create policy "study_slides_read_public" on public.study_slides
  for select using (published = true or public.is_editor());
create policy "study_slides_editor_write" on public.study_slides
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_study_slides_week on public.study_slides (week_id, slide_number);
