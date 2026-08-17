-- ═══════════════════════════════════════════════════════════════════════
-- Code Scripts module — synced from the user's own WP site (nullphpscript.com).
-- Post + image data synced by the VPS runner; web app reads for admin + SEO pages.
-- ═══════════════════════════════════════════════════════════════════════

create table if not exists public.code_scripts (
  id uuid primary key default gen_random_uuid(),
  source_url text not null unique,
  title text not null,
  slug text not null unique,
  category text,
  version text,
  content text,
  excerpt text,
  cover_image text,
  source_image text,
  download_url text,
  source_download_url text,
  seo_title text,
  seo_description text,
  faqs jsonb not null default '[]'::jsonb,
  json_ld jsonb,
  status text not null default 'published'
    check (status in ('published', 'draft', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_synced_at timestamptz
);

create index if not exists idx_code_scripts_category on public.code_scripts (category);
create index if not exists idx_code_scripts_status on public.code_scripts (status);
create index if not exists idx_code_scripts_created on public.code_scripts (created_at desc);

-- Sync run log (visible in admin, like the course-email log)
create table if not exists public.code_script_syncs (
  id uuid primary key default gen_random_uuid(),
  ran_at timestamptz not null default now(),
  sitemap_urls int not null default 0,
  new_found int not null default 0,
  imported int not null default 0,
  failed int not null default 0,
  error text
);

-- Manual "Sync now" request queue (admin inserts; VPS runner picks up)
create table if not exists public.code_script_sync_requests (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending', 'done', 'failed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.code_scripts enable row level security;
alter table public.code_script_syncs enable row level security;
alter table public.code_script_sync_requests enable row level security;

drop policy if exists "code_scripts_public_read" on public.code_scripts;
create policy "code_scripts_public_read" on public.code_scripts
  for select using (status = 'published' or public.is_staff());

drop policy if exists "code_scripts_staff_all" on public.code_scripts;
create policy "code_scripts_staff_all" on public.code_scripts
  for all using (public.is_staff());

drop policy if exists "code_script_syncs_staff_all" on public.code_script_syncs;
create policy "code_script_syncs_staff_all" on public.code_script_syncs
  for all using (public.is_staff());

drop policy if exists "code_script_sync_requests_staff_all" on public.code_script_sync_requests;
create policy "code_script_sync_requests_staff_all" on public.code_script_sync_requests
  for all using (public.is_staff());
