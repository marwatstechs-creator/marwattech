-- ── GitHub App login settings (mirrors google_settings) ────────────────
create table if not exists public.github_settings (
  id            boolean primary key default true,
  app_name      text,
  client_id     text,
  client_secret text,
  enabled       boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.github_settings enable row level security;

drop policy if exists github_settings_admin_all on public.github_settings;
create policy github_settings_admin_all on public.github_settings
  for all to authenticated using (is_super_admin()) with check (is_super_admin());
