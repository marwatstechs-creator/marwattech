-- ============================================================
-- Course Update Notifications + One-Page Course Manager (2026-08-14)
-- Subscribers, update-event log, digest send history, and new
-- course status/type columns. Follows repo conventions (RLS,
-- moddatetime, is_staff()/is_editor() helpers, public read policies).
-- ============================================================

-- 1) Extend courses so admins can filter by Free / Paid / Published /
--    Draft / Archived from a single management page.
alter table public.courses
  add column if not exists status text not null default 'draft'
    check (status in ('draft', 'published', 'archived'));
alter table public.courses
  add column if not exists is_free boolean not null default false;
alter table public.courses
  add column if not exists price numeric(10,2);

-- Keep is_published in sync with status (bidirectional so legacy
-- is_published toggles also update status).
create or replace function public.sync_course_published()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'UPDATE'
     and new.is_published is distinct from old.is_published
     and new.status = old.status
  then
    -- Direct is_published toggle (legacy callers)
    if new.is_published then
      new.status := 'published';
    elsif old.status = 'published' then
      new.status := 'draft';
    end if;
  else
    new.is_published := (new.status = 'published');
  end if;
  return new;
end $$;

drop trigger if exists sync_course_published on public.courses;
create trigger sync_course_published
  before insert or update on public.courses
  for each row execute function public.sync_course_published();

-- 2) Course update subscribers (explicit opt-in, per-user token)
create table if not exists public.course_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced')),
  unsub_token uuid not null default gen_random_uuid(),
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_subscribers_status on public.course_subscribers (status);
create index if not exists idx_course_subscribers_email on public.course_subscribers (email);

-- 3) Course update events — one row per meaningful change; feeds the digest.
create table if not exists public.course_update_events (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.course_lessons(id) on delete cascade,
  event_type text not null,
  summary text,
  meaningful boolean not null default true,
  included_in_digest boolean not null default false,
  digest_send_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_update_events_pending
  on public.course_update_events (meaningful, included_in_digest);
create index if not exists idx_course_update_events_course
  on public.course_update_events (course_id, created_at);

-- 4) Digest send log — one row per subscriber per digest (history + dedup).
create table if not exists public.course_digest_sends (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  event_ids uuid[] not null default '{}',
  courses text[] not null default '{}',
  status text not null default 'sent',
  error text,
  sent_at timestamptz not null default now()
);

create index if not exists idx_course_digest_sends_email on public.course_digest_sends (email, sent_at);

-- 5) Change detection — log meaningful course/lesson changes.
create or replace function public.log_course_update()
returns trigger language plpgsql security definer as $$
declare
  v_event_type text;
  v_summary text;
  v_meaningful boolean;
begin
  if tg_table_name = 'course_lessons' then
    if tg_op = 'INSERT' then
      v_event_type := 'lesson_added';
      v_summary := 'New lesson added: ' || new.title;
      v_meaningful := true;
    elsif tg_op = 'UPDATE' then
      if new.content is distinct from old.content
         or new.video_url is distinct from old.video_url
         or new.title is distinct from old.title
         or new.is_free_preview is distinct from old.is_free_preview then
        v_event_type := 'lesson_updated';
        v_summary := 'Lesson updated: ' || new.title;
        v_meaningful := true;
      else
        v_event_type := 'minor_change';
        v_summary := 'Minor change to lesson: ' || new.title;
        v_meaningful := false;
      end if;
    else -- DELETE
      v_event_type := 'minor_change';
      v_summary := 'Lesson removed: ' || old.title;
      v_meaningful := false;
    end if;

    if v_meaningful then
      insert into public.course_update_events (course_id, lesson_id, event_type, summary, meaningful)
        values (new.course_id, new.id, v_event_type, v_summary, v_meaningful);
    end if;

  elsif tg_table_name = 'courses' then
    if tg_op = 'INSERT' then
      -- Only announce a brand-new course if it's already published.
      if new.status = 'published' then
        insert into public.course_update_events (course_id, event_type, summary, meaningful)
          values (new.id, 'course_created', 'New course: ' || new.title, true);
      end if;
    elsif tg_op = 'UPDATE' then
      if new.status = 'published' and old.status is distinct from 'published' then
        v_event_type := 'course_published';
        v_summary := 'Course published: ' || new.title;
        v_meaningful := true;
      elsif new.description is distinct from old.description then
        v_event_type := 'description_updated';
        v_summary := 'Course description updated: ' || new.title;
        v_meaningful := true;
      elsif new.title is distinct from old.title then
        v_event_type := 'title_updated';
        v_summary := 'Course title updated: ' || new.title;
        v_meaningful := true;
      else
        v_event_type := 'minor_change';
        v_summary := 'Course details updated: ' || new.title;
        v_meaningful := false;
      end if;

      if new.status is distinct from old.status
         or new.description is distinct from old.description
         or new.title is distinct from old.title then
        insert into public.course_update_events (course_id, event_type, summary, meaningful)
          values (new.id, v_event_type, v_summary, v_meaningful);
      end if;
    end if;
  end if;

  return null;
end $$;

drop trigger if exists course_lessons_update_log on public.course_lessons;
create trigger course_lessons_update_log
  after insert or update or delete on public.course_lessons
  for each row execute function public.log_course_update();

drop trigger if exists courses_update_log on public.courses;
create trigger courses_update_log
  after insert or update on public.courses
  for each row execute function public.log_course_update();

-- 6) Row Level Security
alter table public.course_subscribers enable row level security;
alter table public.course_update_events enable row level security;
alter table public.course_digest_sends enable row level security;

-- Public can opt in (insert) — service-role admin client bypasses RLS for
-- read/update, so subscribers' emails are never exposed to other users.
create policy "course_subscribers_insert_public"
  on public.course_subscribers for insert
  with check (status = 'subscribed');

create policy "course_subscribers_staff_all"
  on public.course_subscribers for all
  using (public.is_staff()) with check (public.is_staff());

create policy "course_update_events_read_public"
  on public.course_update_events for select using (true);
create policy "course_update_events_staff_all"
  on public.course_update_events for all
  using (public.is_staff()) with check (public.is_staff());

create policy "course_digest_sends_staff_all"
  on public.course_digest_sends for all
  using (public.is_staff()) with check (public.is_staff());
