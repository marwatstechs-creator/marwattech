-- ── Marwat Tech CRM (Rise-style) ─────────────────────────────────────────
-- Clients, Projects, Estimates, Proposals — the hub for managing agency work.
-- Invoices already exist (public.invoices) and link via client_id/project_id.

-- Clients (CRM records; optionally linked to a portal login)
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  company     text not null,
  contact_name text,
  email       text,
  phone       text,
  address     text,
  website     text,
  notes       text,
  status      text not null default 'active', -- active | inactive | lead
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_clients_status on public.clients(status);

-- Projects (the client portal already queries client_projects)
create table if not exists public.client_projects (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.clients(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete set null, -- portal login owner
  title       text not null,
  description text,
  status      text not null default 'planning', -- planning | in_progress | review | completed | on_hold
  progress    integer not null default 0 check (progress between 0 and 100),
  start_date  date,
  end_date    date,
  budget      numeric(12,2),
  currency    text not null default 'USD',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists idx_client_projects_client on public.client_projects(client_id);

-- Estimates (rich-text body via the Tiptap editor)
create table if not exists public.estimates (
  id              uuid primary key default gen_random_uuid(),
  estimate_number text not null unique,
  client_id       uuid references public.clients(id) on delete set null,
  title           text not null,
  amount          numeric(12,2) not null default 0,
  currency        text not null default 'USD',
  status          text not null default 'draft', -- draft | sent | accepted | declined
  body            text,
  due_date        date,
  sent_at         timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_estimates_client on public.estimates(client_id);

-- Proposals (rich-text body via the Tiptap editor)
create table if not exists public.proposals (
  id              uuid primary key default gen_random_uuid(),
  proposal_number text not null unique,
  client_id       uuid references public.clients(id) on delete set null,
  title           text not null,
  amount          numeric(12,2) not null default 0,
  currency        text not null default 'USD',
  status          text not null default 'draft', -- draft | sent | accepted | declined
  body            text,
  sent_at         timestamptz,
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_proposals_client on public.proposals(client_id);

-- updated_at maintenance
drop trigger if exists handle_clients_updated_at on public.clients;
create trigger handle_clients_updated_at before update on public.clients
  for each row execute function moddatetime('updated_at');
drop trigger if exists handle_client_projects_updated_at on public.client_projects;
create trigger handle_client_projects_updated_at before update on public.client_projects
  for each row execute function moddatetime('updated_at');
drop trigger if exists handle_estimates_updated_at on public.estimates;
create trigger handle_estimates_updated_at before update on public.estimates
  for each row execute function moddatetime('updated_at');
drop trigger if exists handle_proposals_updated_at on public.proposals;
create trigger handle_proposals_updated_at before update on public.proposals
  for each row execute function moddatetime('updated_at');

-- RLS
alter table public.clients enable row level security;
alter table public.client_projects enable row level security;
alter table public.estimates enable row level security;
alter table public.proposals enable row level security;

drop policy if exists clients_staff_all on public.clients;
create policy clients_staff_all on public.clients
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists clients_read_public on public.clients;
create policy clients_read_public on public.clients for select using (true);

drop policy if exists client_projects_staff_all on public.client_projects;
create policy client_projects_staff_all on public.client_projects
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists client_projects_owner_select on public.client_projects;
create policy client_projects_owner_select on public.client_projects
  for select using (user_id = auth.uid());

drop policy if exists estimates_staff_all on public.estimates;
create policy estimates_staff_all on public.estimates
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists estimates_client_select on public.estimates;
create policy estimates_client_select on public.estimates
  for select using (client_id in (select id from public.clients where user_id = auth.uid()));

drop policy if exists proposals_staff_all on public.proposals;
create policy proposals_staff_all on public.proposals
  for all to authenticated using (is_staff()) with check (is_staff());
drop policy if exists proposals_client_select on public.proposals;
create policy proposals_client_select on public.proposals
  for select using (client_id in (select id from public.clients where user_id = auth.uid()));
