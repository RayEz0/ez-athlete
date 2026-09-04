-- EZ Athlete: one cloud-synced state row per account.
-- Run this in Supabase SQL Editor.
create table if not exists public.ez_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ez_app_state enable row level security;

revoke all on table public.ez_app_state from anon;
grant select, insert, update, delete on table public.ez_app_state to authenticated;

drop policy if exists "Users can read their own EZ Athlete state" on public.ez_app_state;
create policy "Users can read their own EZ Athlete state"
on public.ez_app_state for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own EZ Athlete state" on public.ez_app_state;
create policy "Users can insert their own EZ Athlete state"
on public.ez_app_state for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own EZ Athlete state" on public.ez_app_state;
create policy "Users can update their own EZ Athlete state"
on public.ez_app_state for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own EZ Athlete state" on public.ez_app_state;
create policy "Users can delete their own EZ Athlete state"
on public.ez_app_state for delete to authenticated
using ((select auth.uid()) = user_id);


-- Immutable daily snapshots: one backup per user per calendar day.
create table if not exists public.ez_app_backups (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  backup_date date not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique(user_id, backup_date)
);

alter table public.ez_app_backups enable row level security;
revoke all on table public.ez_app_backups from anon;
grant select, insert on table public.ez_app_backups to authenticated;

drop policy if exists "Users can read their own EZ Athlete backups" on public.ez_app_backups;
create policy "Users can read their own EZ Athlete backups"
on public.ez_app_backups for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own EZ Athlete backups" on public.ez_app_backups;
create policy "Users can create their own EZ Athlete backups"
on public.ez_app_backups for insert to authenticated
with check ((select auth.uid()) = user_id);

-- Email archive support. The app writes the signed-in email alongside its state,
-- allowing the server-side daily archive function to find this personal account.
alter table public.ez_app_state add column if not exists email text;
create index if not exists ez_app_state_email_idx on public.ez_app_state(email);
