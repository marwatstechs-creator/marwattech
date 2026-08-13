-- ═══════════════════════════════════════════════════════════════════════
-- Marwat Tech — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).
-- ═══════════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "moddatetime"; -- updated_at triggers

-- ── Enums ───────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('super_admin', 'editor', 'support', 'client');
exception when duplicate_object then null; end $$;

alter type public.user_role add value if not exists 'client';

do $$ begin
  create type public.content_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('new', 'reviewed', 'interview', 'rejected', 'hired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_status as enum ('new', 'read', 'replied', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

-- ── Profiles (extends auth.users) ───────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role public.user_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a user signs up. Public signups are
-- clients (staff are created with explicit roles via the seed script).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', new.email),
    new.raw_user_meta_data ->> 'avatar_url',
    'client'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Service categories ──────────────────────────────────────────────────
create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Services ────────────────────────────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  icon text,
  summary text,
  content text,               -- rich HTML
  benefits jsonb,             -- [{ title, description }]
  process jsonb,              -- [{ step, title, description }]
  faqs jsonb,                 -- [{ question, answer }]
  category_id uuid references public.service_categories (id) on delete set null,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Portfolio categories ────────────────────────────────────────────────
create table if not exists public.portfolio_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Portfolio items ─────────────────────────────────────────────────────
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  client_name text,
  industry text,
  summary text,
  content text,
  technologies jsonb,         -- ["Next.js", "Supabase", ...]
  images jsonb,               -- [{ url, alt }]
  cover_image text,
  project_url text,
  category_id uuid references public.portfolio_categories (id) on delete set null,
  status public.content_status not null default 'draft',
  featured boolean not null default false,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Blog categories / tags ──────────────────────────────────────────────
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- ── Blog posts ──────────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,      -- rich HTML
  cover_image text,
  author_id uuid references public.profiles (id) on delete set null,
  category_id uuid references public.blog_categories (id) on delete set null,
  reading_time integer,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_tags (
  post_id uuid references public.blog_posts (id) on delete cascade,
  tag_id uuid references public.blog_tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

-- ── Testimonials ────────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  company text,
  role text,
  quote text not null,
  rating integer not null default 5 check (rating between 1 and 5),
  avatar_url text,
  featured boolean not null default false,
  status public.content_status not null default 'published',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── Careers ─────────────────────────────────────────────────────────────
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  department text,
  location text,
  job_type text,              -- Full-time, Part-time, Contract, Remote
  salary_range text,
  description text,
  requirements text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  career_id uuid references public.careers (id) on delete cascade not null,
  applicant_name text not null,
  email text not null,
  phone text,
  resume_url text,
  cover_letter text,
  status public.application_status not null default 'new',
  created_at timestamptz not null default now()
);

-- ── Inbound forms ───────────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text,
  service text,
  message text not null,
  status public.message_status not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  issue_type text not null,
  priority public.ticket_priority not null default 'normal',
  subject text,
  message text not null,
  status public.message_status not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.mockup_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  website_type text not null,
  budget_range text,
  description text not null,
  status public.message_status not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now()
);

-- ── Media library ───────────────────────────────────────────────────────
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  path text not null unique,  -- storage bucket path
  url text not null,
  mime_type text,
  size bigint,
  created_at timestamptz not null default now()
);

-- ── Site settings (key/value) ───────────────────────────────────────────
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  updated_at timestamptz not null default now()
);

-- ── Activity log ────────────────────────────────────────────────────────
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ── updated_at triggers ─────────────────────────────────────────────────
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at before update on public.services
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at before update on public.portfolio_items
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at before update on public.blog_posts
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at before update on public.careers
  for each row execute procedure moddatetime (updated_at);
create trigger handle_updated_at before update on public.site_settings
  for each row execute procedure moddatetime (updated_at);

-- ═══════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Public: anonymous can read published content + submit forms.
-- Admin: authenticated staff manage content (checked against profiles.role).
-- ═══════════════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.service_categories enable row level security;
alter table public.services enable row level security;
alter table public.portfolio_categories enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_tags enable row level security;
alter table public.blog_posts enable row level security;
alter table public.post_tags enable row level security;
alter table public.testimonials enable row level security;
alter table public.careers enable row level security;
alter table public.applications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.support_tickets enable row level security;
alter table public.mockup_requests enable row level security;
alter table public.media enable row level security;
alter table public.site_settings enable row level security;
alter table public.activity_logs enable row level security;

-- Helper: is the current user an admin/editor/support member?
create or replace function public.is_staff()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'editor', 'support')
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('super_admin', 'editor')
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  );
$$;

-- ── Profiles ────────────────────────────────────────────────────────────
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select role from public.profiles where id = auth.uid())
  );

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_super_admin());

-- ── Public read of published content ────────────────────────────────────
create or replace function public.rls_published(t status)
  returns boolean
  language sql
  immutable
as $$ select t = 'published' or public.is_editor(); $$;

-- Services & categories
drop policy if exists "services_read_published" on public.services;
create policy "services_read_published" on public.services
  for select using (status = 'published' or public.is_editor());

drop policy if exists "services_editor_write" on public.services;
create policy "services_editor_write" on public.services
  for all using (public.is_editor());

drop policy if exists "service_categories_read" on public.service_categories;
create policy "service_categories_read" on public.service_categories
  for select using (true);

drop policy if exists "service_categories_editor_write" on public.service_categories;
create policy "service_categories_editor_write" on public.service_categories
  for all using (public.is_editor());

-- Portfolio
drop policy if exists "portfolio_read_published" on public.portfolio_items;
create policy "portfolio_read_published" on public.portfolio_items
  for select using (status = 'published' or public.is_editor());

drop policy if exists "portfolio_editor_write" on public.portfolio_items;
create policy "portfolio_editor_write" on public.portfolio_items
  for all using (public.is_editor());

drop policy if exists "portfolio_categories_read" on public.portfolio_categories;
create policy "portfolio_categories_read" on public.portfolio_categories
  for select using (true);

drop policy if exists "portfolio_categories_editor_write" on public.portfolio_categories;
create policy "portfolio_categories_editor_write" on public.portfolio_categories
  for all using (public.is_editor());

-- Blog
drop policy if exists "posts_read_published" on public.blog_posts;
create policy "posts_read_published" on public.blog_posts
  for select using (status = 'published' or public.is_editor());

drop policy if exists "posts_editor_write" on public.blog_posts;
create policy "posts_editor_write" on public.blog_posts
  for all using (public.is_editor());

drop policy if exists "blog_categories_read" on public.blog_categories;
create policy "blog_categories_read" on public.blog_categories
  for select using (true);

drop policy if exists "blog_categories_editor_write" on public.blog_categories;
create policy "blog_categories_editor_write" on public.blog_categories
  for all using (public.is_editor());

drop policy if exists "blog_tags_read" on public.blog_tags;
create policy "blog_tags_read" on public.blog_tags
  for select using (true);

drop policy if exists "blog_tags_editor_write" on public.blog_tags;
create policy "blog_tags_editor_write" on public.blog_tags
  for all using (public.is_editor());

drop policy if exists "post_tags_read" on public.post_tags;
create policy "post_tags_read" on public.post_tags
  for select using (true);

drop policy if exists "post_tags_editor_write" on public.post_tags;
create policy "post_tags_editor_write" on public.post_tags
  for all using (public.is_editor());

-- Testimonials
drop policy if exists "testimonials_read_published" on public.testimonials;
create policy "testimonials_read_published" on public.testimonials
  for select using (status = 'published' or public.is_editor());

drop policy if exists "testimonials_editor_write" on public.testimonials;
create policy "testimonials_editor_write" on public.testimonials
  for all using (public.is_editor());

-- Careers
drop policy if exists "careers_read_published" on public.careers;
create policy "careers_read_published" on public.careers
  for select using (status = 'published' or public.is_editor());

drop policy if exists "careers_editor_write" on public.careers;
create policy "careers_editor_write" on public.careers
  for all using (public.is_editor());

-- Applications: visitors insert, staff read/update
drop policy if exists "applications_insert_public" on public.applications;
create policy "applications_insert_public" on public.applications
  for insert with check (true);

drop policy if exists "applications_staff_read" on public.applications;
create policy "applications_staff_read" on public.applications
  for select using (public.is_staff());

drop policy if exists "applications_staff_update" on public.applications;
create policy "applications_staff_update" on public.applications
  for update using (public.is_staff());

-- Inbound forms: anyone can submit; staff can read/update
drop policy if exists "contact_insert_public" on public.contact_messages;
create policy "contact_insert_public" on public.contact_messages
  for insert with check (true);

drop policy if exists "contact_staff_read" on public.contact_messages;
create policy "contact_staff_read" on public.contact_messages
  for select using (public.is_staff());

drop policy if exists "contact_staff_update" on public.contact_messages;
create policy "contact_staff_update" on public.contact_messages
  for update using (public.is_staff());

drop policy if exists "support_insert_public" on public.support_tickets;
create policy "support_insert_public" on public.support_tickets
  for insert with check (true);

drop policy if exists "support_staff_read" on public.support_tickets;
create policy "support_staff_read" on public.support_tickets
  for select using (public.is_staff());

drop policy if exists "support_staff_update" on public.support_tickets;
create policy "support_staff_update" on public.support_tickets
  for update using (public.is_staff());

drop policy if exists "mockup_insert_public" on public.mockup_requests;
create policy "mockup_insert_public" on public.mockup_requests
  for insert with check (true);

drop policy if exists "mockup_staff_read" on public.mockup_requests;
create policy "mockup_staff_read" on public.mockup_requests
  for select using (public.is_staff());

drop policy if exists "mockup_staff_update" on public.mockup_requests;
create policy "mockup_staff_update" on public.mockup_requests
  for update using (public.is_staff());

-- Media: public can read (via storage), staff manage
drop policy if exists "media_read_public" on public.media;
create policy "media_read_public" on public.media
  for select using (true);

drop policy if exists "media_editor_write" on public.media;
create policy "media_editor_write" on public.media
  for all using (public.is_editor());

-- Site settings: only super admin edits; only whitelisted public keys readable
drop policy if exists "settings_read_public" on public.site_settings;
create policy "settings_read_public" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all using (public.is_super_admin());

-- Activity logs: staff read, app writes (via service role)
drop policy if exists "activity_staff_read" on public.activity_logs;
create policy "activity_staff_read" on public.activity_logs
  for select using (public.is_staff());

drop policy if exists "activity_editor_insert" on public.activity_logs;
create policy "activity_editor_insert" on public.activity_logs
  for insert with check (public.is_editor());

-- ── Storage buckets ─────────────────────────────────────────────────────
-- Run these in the Supabase dashboard or via the SQL editor:
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media_storage_public_read" on storage.objects;
create policy "media_storage_public_read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media_storage_editor_write" on storage.objects;
create policy "media_storage_editor_write" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_editor());

drop policy if exists "media_storage_editor_update" on storage.objects;
create policy "media_storage_editor_update" on storage.objects
  for update using (bucket_id = 'media' and public.is_editor());

drop policy if exists "media_storage_editor_delete" on storage.objects;
create policy "media_storage_editor_delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_editor());

-- ── Indexes ─────────────────────────────────────────────────────────────
create index if not exists idx_services_status on public.services (status);
create index if not exists idx_services_category on public.services (category_id);
create index if not exists idx_portfolio_status on public.portfolio_items (status);
create index if not exists idx_portfolio_category on public.portfolio_items (category_id);
create index if not exists idx_posts_status on public.blog_posts (status);
create index if not exists idx_posts_published_at on public.blog_posts (published_at desc);
create index if not exists idx_posts_category on public.blog_posts (category_id);
create index if not exists idx_testimonials_featured on public.testimonials (featured);
create index if not exists idx_careers_status on public.careers (status);
create index if not exists idx_applications_career on public.applications (career_id);
create index if not exists idx_contact_status on public.contact_messages (status);
create index if not exists idx_support_status on public.support_tickets (status);
create index if not exists idx_mockup_status on public.mockup_requests (status);
create index if not exists idx_activity_created on public.activity_logs (created_at desc);
