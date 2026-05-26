-- AJ Pronos — Schéma profiles + abos
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. ENUM : tier d'abonnement
-- ============================================================
do $$ begin
  create type subscription_tier as enum ('trial', 'starter', 'pro', 'vip');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. TABLE profiles (mirror auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  tier                subscription_tier,           -- null = pas d'abo (vient de signer, pas encore lancé trial)
  trial_started_at    timestamptz,
  trial_ends_at       timestamptz,
  subscription_status subscription_status,
  -- IDs externes (à brancher quand RevenueCat/Stripe seront actifs)
  revenuecat_user_id  text,
  stripe_customer_id  text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- 3. RLS — user ne voit que son propre profile
-- ============================================================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Insertion = uniquement par le trigger, pas en direct depuis le client
-- (pas de policy insert pour role authenticated)

-- ============================================================
-- 4. TRIGGER : créer un profile à chaque nouveau user
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5. TRIGGER : maintenir updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. BACKFILL — créer un profile pour les users existants
-- ============================================================
insert into public.profiles (id, created_at, updated_at)
select id, created_at, now()
from auth.users
on conflict (id) do nothing;
