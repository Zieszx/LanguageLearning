-- Cakap database schema.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL -> New query).
-- It is idempotent enough to re-run safely.

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user, holds role + display name)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text,
  role         text not null default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- SECURITY DEFINER helper so admin policies don't recurse on profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- Stop a normal user from promoting themselves to admin.
create or replace function public.guard_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_role_change on public.profiles;
create trigger guard_role_change
  before update on public.profiles
  for each row execute function public.guard_role_change();

-- Auto-create a profile when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Per-user settings
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  theme            text not null default 'system',
  active_language  text not null default 'ms',
  level            text not null default 'beginner',
  voice_enabled    boolean not null default true,
  show_romanization boolean not null default true,
  updated_at       timestamptz not null default now()
);
alter table public.settings enable row level security;
drop policy if exists "settings_own" on public.settings;
create policy "settings_own" on public.settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Vocabulary
-- ---------------------------------------------------------------------------
create table if not exists public.vocab (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  word       text not null,
  meaning    text not null default '',
  language   text not null,
  created_at timestamptz not null default now()
);
create index if not exists vocab_user_idx on public.vocab (user_id, created_at desc);
alter table public.vocab enable row level security;
drop policy if exists "vocab_own" on public.vocab;
create policy "vocab_own" on public.vocab
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Conversations (messages stored as JSON for simplicity)
-- ---------------------------------------------------------------------------
create table if not exists public.conversations (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null default 'Free chat',
  language_code text not null,
  scenario_id  text,
  scenario     jsonb,
  level        text not null default 'beginner',
  messages     jsonb not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);
alter table public.conversations enable row level security;
drop policy if exists "conversations_own" on public.conversations;
create policy "conversations_own" on public.conversations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Custom characters
-- ---------------------------------------------------------------------------
create table if not exists public.characters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  title        text not null,
  description  text not null default '',
  character    text not null,
  situation    text not null default '',
  emoji        text not null default '🎭',
  language_code text,
  created_at   timestamptz not null default now()
);
create index if not exists characters_user_idx
  on public.characters (user_id, created_at desc);
alter table public.characters enable row level security;
drop policy if exists "characters_own" on public.characters;
create policy "characters_own" on public.characters
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Shared scenarios (curated by admins, visible to every signed-in user)
-- ---------------------------------------------------------------------------
create table if not exists public.shared_scenarios (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  character    text not null,
  situation    text not null default '',
  emoji        text not null default '🎭',
  language_code text,
  created_at   timestamptz not null default now()
);
alter table public.shared_scenarios enable row level security;

drop policy if exists "shared_scenarios_read" on public.shared_scenarios;
create policy "shared_scenarios_read" on public.shared_scenarios
  for select using (auth.uid() is not null);

drop policy if exists "shared_scenarios_admin_insert" on public.shared_scenarios;
create policy "shared_scenarios_admin_insert" on public.shared_scenarios
  for insert with check (public.is_admin());

drop policy if exists "shared_scenarios_admin_update" on public.shared_scenarios;
create policy "shared_scenarios_admin_update" on public.shared_scenarios
  for update using (public.is_admin());

drop policy if exists "shared_scenarios_admin_delete" on public.shared_scenarios;
create policy "shared_scenarios_admin_delete" on public.shared_scenarios
  for delete using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Practice events (powers streaks / progress)
-- ---------------------------------------------------------------------------
create table if not exists public.practice_events (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null default 'message',  -- message | word_saved | review
  language_code text,
  created_at    timestamptz not null default now()
);
create index if not exists practice_events_user_idx
  on public.practice_events (user_id, created_at desc);
alter table public.practice_events enable row level security;
drop policy if exists "practice_events_own" on public.practice_events;
create policy "practice_events_own" on public.practice_events
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Spaced-repetition review state (one row per saved word)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  vocab_id   uuid primary key references public.vocab (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  due_at     timestamptz not null default now(),
  interval_days integer not null default 0,
  ease       real not null default 2.5,
  reps       integer not null default 0,
  updated_at timestamptz not null default now()
);
create index if not exists reviews_due_idx on public.reviews (user_id, due_at);
alter table public.reviews enable row level security;
drop policy if exists "reviews_own" on public.reviews;
create policy "reviews_own" on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
