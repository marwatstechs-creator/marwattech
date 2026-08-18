-- Named ad areas (e.g. code-scripts-article-after-download). Each area can
-- hold at most one enabled ad; the frontend renders <AdSlot area="…" />.
alter table public.ads
  add column if not exists area text;

comment on column public.ads.area is
  'Named ad-area key from the AD_AREAS registry (lib/ads.ts). Nullable for legacy ads.';
