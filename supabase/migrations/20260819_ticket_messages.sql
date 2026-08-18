-- Ticket conversation system: two-way support threads
-- Extends message_status with the full ticket workflow, adds a
-- ticket_messages table for the conversation, and tracks activity on tickets.

-- 1) Extend the shared status enum with ticket workflow statuses.
--    (One value per ALTER TYPE statement; these become usable after this
--    migration commits.)
alter type public.message_status add value if not exists 'open';
alter type public.message_status add value if not exists 'in_progress';
alter type public.message_status add value if not exists 'waiting_on_customer';
alter type public.message_status add value if not exists 'resolved';
alter type public.message_status add value if not exists 'closed';

-- 2) Add lifecycle columns to support_tickets.
alter table public.support_tickets add column if not exists updated_at timestamptz not null default now();
alter table public.support_tickets add column if not exists closed_at timestamptz;
alter table public.support_tickets add column if not exists assigned_to uuid references public.profiles (id) on delete set null;
alter table public.support_tickets add column if not exists last_message_at timestamptz;

create index if not exists idx_support_updated on public.support_tickets (updated_at desc);
create index if not exists idx_support_assigned on public.support_tickets (assigned_to);

-- 3) Conversation table: one row per message in the thread.
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_type text not null check (sender_type in ('customer', 'staff', 'system')),
  sender_id uuid references public.profiles (id) on delete set null,
  sender_name text,
  sender_email text,
  body text not null,
  attachments jsonb not null default '[]'::jsonb,
  internal boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_ticket_messages_ticket on public.ticket_messages (ticket_id, created_at);

-- 4) RLS on ticket_messages.
alter table public.ticket_messages enable row level security;

drop policy if exists "ticket_messages_staff_all" on public.ticket_messages;
create policy "ticket_messages_staff_all" on public.ticket_messages
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'editor', 'support')
    )
  ) with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('super_admin', 'editor', 'support')
    )
  );

drop policy if exists "ticket_messages_customer_read_own" on public.ticket_messages;
create policy "ticket_messages_customer_read_own" on public.ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and (t.email = auth.jwt() ->> 'email' or t.email = coalesce((select email from public.profiles where id = auth.uid()), ''))
    )
    and internal = false
  );

drop policy if exists "ticket_messages_customer_insert_own" on public.ticket_messages;
create policy "ticket_messages_customer_insert_own" on public.ticket_messages
  for insert with check (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and (t.email = auth.jwt() ->> 'email' or t.email = coalesce((select email from public.profiles where id = auth.uid()), ''))
    )
    and sender_type = 'customer'
    and internal = false
  );

-- 5) Keep support_tickets.updated_at in sync.
drop trigger if exists handle_updated_at on public.support_tickets;
create trigger handle_updated_at before update on public.support_tickets
  for each row execute procedure moddatetime (updated_at);
