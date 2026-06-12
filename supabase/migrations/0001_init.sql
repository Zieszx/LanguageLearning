-- Cakap database schema + Row-Level Security.
-- Run this in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, holds role + disabled flag
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text,
  role       text not null default 'user' check (role in ('admin', 'user')),
  disabled   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Create a profile automatically whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: is the current user an admin? SECURITY DEFINER bypasses RLS so this
-- does not recurse when used inside the profiles policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- vocab
-- ---------------------------------------------------------------------------
create table if not exists public.vocab (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  word       text not null,
  meaning    text not null default '',
  language   text not null,
  created_at timestamptz not null default now()
);

alter table public.vocab enable row level security;

-- ---------------------------------------------------------------------------
-- conversations (messages stored as JSON for simplicity)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  title         text not null default 'Conversation',
  language_code text not null,
  scenario_id   text,
  level         text not null default 'beginner',
  messages      jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.conversations enable row level security;

-- ---------------------------------------------------------------------------
-- usage: per-user, per-day message counts (quota protection + admin insight)
-- ---------------------------------------------------------------------------
create table if not exists public.usage (
  user_id       uuid not null references auth.users (id) on delete cascade,
  day           date not null default current_date,
  message_count integer not null default 0,
  primary key (user_id, day)
);

alter table public.usage enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
-- profiles: read your own (or any if admin); update your own; admins manage all.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- vocab: owners do everything with their rows; admins may read.
drop policy if exists "vocab_owner" on public.vocab;
create policy "vocab_owner" on public.vocab
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "vocab_admin_read" on public.vocab;
create policy "vocab_admin_read" on public.vocab
  for select using (public.is_admin());

-- conversations: owners do everything; admins may read.
drop policy if exists "conv_owner" on public.conversations;
create policy "conv_owner" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "conv_admin_read" on public.conversations;
create policy "conv_admin_read" on public.conversations
  for select using (public.is_admin());

-- usage: readable by owner or admin. Writes happen via the service role
-- (server-side), which bypasses RLS, so no insert/update policy is needed.
drop policy if exists "usage_select" on public.usage;
create policy "usage_select" on public.usage
  for select using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Atomic helper to increment today's message count for a user.
-- ---------------------------------------------------------------------------
create or replace function public.increment_usage(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.usage (user_id, day, message_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, day)
  do update set message_count = public.usage.message_count + 1
  returning message_count into new_count;
  return new_count;
end;
$$;
