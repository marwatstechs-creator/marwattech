-- Google AdSense ad units
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ad_client text not null,
  slot_id text,
  format text not null default 'auto',
  placement text not null default 'in_content',
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger handle_updated_at before update on public.ads
  for each row execute procedure moddatetime (updated_at);
alter table public.ads enable row level security;
create policy "ads_read_public" on public.ads
  for select using (true);
create policy "ads_editor_write" on public.ads
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_ads_enabled on public.ads (enabled, sort_order);

-- Study materials (public downloads page)
create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size bigint,
  category text,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.study_materials enable row level security;
create policy "study_materials_read_public" on public.study_materials
  for select using (is_published = true or public.is_editor());
create policy "study_materials_editor_write" on public.study_materials
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_study_materials_published on public.study_materials (is_published, created_at desc);
