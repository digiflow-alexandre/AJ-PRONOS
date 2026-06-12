-- AJ Pronos — Migration 002 : champs onboarding + rôles
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. Étendre la table profiles avec les champs onboarding + rôles
-- ============================================================
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists sports_followed text[] default '{}'::text[],
  add column if not exists risk_level text default 'equilibre',
  add column if not exists notifications_opted_in boolean default false,
  add column if not exists role text default 'user';

-- ============================================================
-- 2. Contraintes de validation
-- ============================================================
do $$ begin
  alter table public.profiles
    add constraint profiles_risk_level_check
    check (risk_level in ('prudent', 'equilibre', 'audacieux'));
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_role_check
    check (role in ('user', 'validator', 'admin'));
exception when duplicate_object then null; end $$;

-- ============================================================
-- 3. Index utile sur role (pour gating admin)
-- ============================================================
create index if not exists profiles_role_idx on public.profiles(role);

-- ============================================================
-- 4. Rappel : pour passer un user en validator/admin (Julien & Alex)
-- ============================================================
-- update public.profiles set role = 'admin' where id = '<uuid de Julien>';
-- update public.profiles set role = 'validator' where id = '<uuid de quelqu'un d'autre>';
