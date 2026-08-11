-- ═══════════════════════════════════════════════════════════════════════
-- Marwat Tech — Email marketing + PayPal feature tables
-- Run after supabase/schema.sql + supabase/payments.sql.
-- ═══════════════════════════════════════════════════════════════════════

-- ── Email marketing ────────────────────────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text,
  source text not null default 'website',
  status text not null default 'subscribed', -- subscribed | unsubscribed | bounced
  unsub_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.email_campaigns (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  audience text not null default 'subscribers', -- subscribers | clients | custom
  custom_emails jsonb not null default '[]'::jsonb,
  status text not null default 'draft',        -- draft | sending | sent | failed
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipients_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.email_campaigns (id) on delete cascade,
  email text not null,
  status text not null default 'pending', -- pending | sent | failed | bounced
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, email)
);

create index if not exists campaign_recipients_campaign_idx on public.campaign_recipients (campaign_id);

-- ── Invoices ───────────────────────────────────────────────────────────
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  client_id uuid references auth.users (id) on delete set null,
  client_name text,
  client_email text,
  project_id uuid,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  status text not null default 'draft', -- draft | sent | paid | overdue | cancelled
  description text,
  line_items jsonb not null default '[]'::jsonb,
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  paypal_invoice_id text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists invoices_client_email_idx on public.invoices (client_email);
create index if not exists invoices_status_idx on public.invoices (status);

-- ── Payouts ────────────────────────────────────────────────────────────
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  recipient_name text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  note text,
  status text not null default 'pending', -- pending | processed | failed
  paypal_payout_batch_id text,
  paypal_payout_item_id text,
  error text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists payouts_created_idx on public.payouts (created_at desc);

-- ── Subscriptions ──────────────────────────────────────────────────────
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  interval text not null default 'month', -- month | year
  features jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.paypal_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.subscription_plans (id) on delete set null,
  paypal_plan_id text,
  paypal_subscription_id text,
  customer_name text,
  customer_email text,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  interval text not null default 'month',
  status text not null default 'pending', -- pending | approved | active | cancelled | suspended | expired
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paypal_subscriptions_email_idx on public.paypal_subscriptions (customer_email);

-- ── Vault: saved payment methods ───────────────────────────────────────
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  customer_email text,
  paypal_payment_token_id text unique,
  instrument_type text,
  brand text,
  last4 text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists payment_methods_email_idx on public.payment_methods (customer_email);

-- ── PayPal disputes ────────────────────────────────────────────────────
create table if not exists public.paypal_disputes (
  id uuid primary key default gen_random_uuid(),
  dispute_id text unique not null,
  state text,
  reason text,
  amount numeric(12,2),
  currency text,
  buyer_email text,
  status text not null default 'open',
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists paypal_disputes_state_idx on public.paypal_disputes (state);

-- ── RLS ────────────────────────────────────────────────────────────────
alter table public.newsletter_subscribers enable row level security;
alter table public.email_campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.invoices enable row level security;
alter table public.payouts enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.paypal_subscriptions enable row level security;
alter table public.payment_methods enable row level security;
alter table public.paypal_disputes enable row level security;

-- Public can subscribe to the newsletter (and read active plans).
drop policy if exists "newsletter_insert_public" on public.newsletter_subscribers;
create policy "newsletter_insert_public" on public.newsletter_subscribers
  for insert with check (status = 'subscribed');
drop policy if exists "newsletter_staff_all" on public.newsletter_subscribers;
create policy "newsletter_staff_all" on public.newsletter_subscribers
  for all using (public.is_staff());

drop policy if exists "campaigns_staff_all" on public.email_campaigns;
create policy "campaigns_staff_all" on public.email_campaigns
  for all using (public.is_staff());
drop policy if exists "recipients_staff_all" on public.campaign_recipients;
create policy "recipients_staff_all" on public.campaign_recipients
  for all using (public.is_staff());

drop policy if exists "invoices_staff_all" on public.invoices;
create policy "invoices_staff_all" on public.invoices
  for all using (public.is_staff());
drop policy if exists "invoices_client_select" on public.invoices;
create policy "invoices_client_select" on public.invoices
  for select using (client_email = (select email from auth.users where id = auth.uid()));

drop policy if exists "payouts_staff_all" on public.payouts;
create policy "payouts_staff_all" on public.payouts
  for all using (public.is_staff());

drop policy if exists "plans_read_active" on public.subscription_plans;
create policy "plans_read_active" on public.subscription_plans
  for select using (active = true);
drop policy if exists "plans_staff_all" on public.subscription_plans;
create policy "plans_staff_all" on public.subscription_plans
  for all using (public.is_staff());

drop policy if exists "subscriptions_staff_all" on public.paypal_subscriptions;
create policy "subscriptions_staff_all" on public.paypal_subscriptions
  for all using (public.is_staff());
drop policy if exists "subscriptions_client_select" on public.paypal_subscriptions;
create policy "subscriptions_client_select" on public.paypal_subscriptions
  for select using (customer_email = (select email from auth.users where id = auth.uid()));

drop policy if exists "payment_methods_staff_all" on public.payment_methods;
create policy "payment_methods_staff_all" on public.payment_methods
  for all using (public.is_staff());
drop policy if exists "payment_methods_client_select" on public.payment_methods;
create policy "payment_methods_client_select" on public.payment_methods
  for select using (customer_email = (select email from auth.users where id = auth.uid()));

drop policy if exists "disputes_staff_all" on public.paypal_disputes;
create policy "disputes_staff_all" on public.paypal_disputes
  for all using (public.is_staff());
