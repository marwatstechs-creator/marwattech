-- Sticky bottom ad: optional separate mobile ad unit/size
alter table public.ads add column if not exists mobile_slot_id text;
alter table public.ads add column if not exists mobile_format text not null default 'auto';
