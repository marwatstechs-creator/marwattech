-- Lexical editor migration: structured editor state per content table.
-- Existing HTML stays in `content` (regenerated on save); `content_json`
-- holds the Lexical JSON state for round-trip editing + rich rendering.
alter table public.blog_posts add column if not exists content_json jsonb;
alter table public.pages add column if not exists content_json jsonb;
alter table public.services add column if not exists content_json jsonb;
alter table public.portfolio_items add column if not exists content_json jsonb;
alter table public.careers add column if not exists description_json jsonb;
alter table public.careers add column if not exists requirements_json jsonb;
