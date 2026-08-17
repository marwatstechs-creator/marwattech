-- Store every download link found on a source post (from
-- .download-link-section input.nps-form-control values). The first one is
-- also mirrored into download_url / source_download_url for backward compat.
alter table public.code_scripts
  add column if not exists download_links jsonb;

comment on column public.code_scripts.download_links is
  'Array of direct download URLs scraped from the source post.';
