-- ═══════════════════════════════════════════════════════════════════════
-- Marwat Tech — Payments table (PayPal Orders API v2)
-- Run after supabase/schema.sql (requires pgcrypto + moddatetime + is_staff).
-- ═══════════════════════════════════════════════════════════════════════

-- Status lifecycle: pending → completed | failed | cancelled → refunded
do $$ begin
  create type public.payment_status as enum ('pending', 'completed', 'failed', 'refunded', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id text unique not null,              -- internal reference, e.g. MT-A1B2C3D4
  paypal_order_id text,                       -- PayPal Orders API v2 order id
  paypal_capture_id text,                     -- id of the successful capture
  amount numeric(12,2) not null,              -- exact amount authorized/captured
  currency text not null default 'USD',
  status public.payment_status not null default 'pending',
  item_type text,                             -- service | project | deposit | custom
  item_name text,                             -- human readable line item
  description text,
  customer_name text,
  customer_email text,
  payer_name text,                            -- PayPal account holder name
  payer_email text,                           -- PayPal account email
  metadata jsonb not null default '{}'::jsonb, -- capture details, notes, etc.
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_created_idx on public.payments (created_at desc);
create index if not exists payments_customer_email_idx on public.payments (customer_email);
create index if not exists payments_paypal_order_idx on public.payments (paypal_order_id);

-- Keep updated_at fresh (moddatetime extension from schema.sql).
drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute procedure moddatetime(updated_at);

-- ── Row Level Security ──────────────────────────────────────────────────
alter table public.payments enable row level security;

-- Public (anonymous) visitors may create a pending order record only.
-- Staff inserts go through the service-role client (bypasses RLS).
drop policy if exists "payments_insert_public" on public.payments;
create policy "payments_insert_public" on public.payments
  for insert
  with check (status = 'pending');

-- Staff can read every payment (admin dashboard).
drop policy if exists "payments_staff_read" on public.payments;
create policy "payments_staff_read" on public.payments
  for select
  using (public.is_staff());

-- Staff can update status (refund / cancel / mark complete).
drop policy if exists "payments_staff_update" on public.payments;
create policy "payments_staff_update" on public.payments
  for update
  using (public.is_staff());

-- Clients with an account can read their own payments by email.
drop policy if exists "payments_client_select_own" on public.payments;
create policy "payments_client_select_own" on public.payments
  for select
  using (customer_email = (select email from auth.users where id = auth.uid()));
