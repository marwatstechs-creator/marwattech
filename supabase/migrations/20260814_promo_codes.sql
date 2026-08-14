-- Promo codes (manual admin codes + auto Udemy feed rows)
create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  store text not null default 'Udemy',
  code text not null,
  discount_label text,
  url text not null,
  image_url text,
  category text,
  tag text not null default 'other',
  source text not null default 'manual',
  expires_at timestamptz,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger handle_updated_at before update on public.promo_codes
  for each row execute procedure moddatetime (updated_at);
alter table public.promo_codes enable row level security;
create policy "promo_codes_read_public" on public.promo_codes
  for select using (enabled = true or public.is_editor());
create policy "promo_codes_editor_write" on public.promo_codes
  for all to authenticated using (public.is_editor()) with check (public.is_editor());
create index if not exists idx_promo_codes_enabled on public.promo_codes (enabled, sort_order);
