-- AI admin panel: conversation history per admin user.
create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.ai_messages enable row level security;

create policy "users read own ai messages"
  on public.ai_messages for select using (auth.uid() = user_id);
create policy "users insert own ai messages"
  on public.ai_messages for insert with check (auth.uid() = user_id);
create policy "users delete own ai messages"
  on public.ai_messages for delete using (auth.uid() = user_id);

create index if not exists ai_messages_user_idx
  on public.ai_messages (user_id, created_at desc);
