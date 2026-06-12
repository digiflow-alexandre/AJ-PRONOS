-- AJ Pronos — Migration 004 : pseudo + date de naissance
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. Activer l'extension citext pour pseudo case-insensitive
-- ============================================================
create extension if not exists citext;

-- ============================================================
-- 2. Ajouter colonnes pseudo + date de naissance
-- ============================================================
alter table public.profiles
  add column if not exists display_name citext,
  add column if not exists date_of_birth date;

-- ============================================================
-- 3. Contraintes
-- ============================================================
-- Unicité du pseudo (case-insensitive grâce à citext)
-- → "Alex" et "alex" considérés comme identiques
do $$ begin
  alter table public.profiles
    add constraint profiles_display_name_unique unique (display_name);
exception when duplicate_object then null; end $$;

-- Format pseudo : 3-20 caractères, alphanumériques + underscore + tiret
do $$ begin
  alter table public.profiles
    add constraint profiles_display_name_format
    check (display_name is null or display_name ~ '^[a-zA-Z0-9_-]{3,20}$');
exception when duplicate_object then null; end $$;

-- Date de naissance : impossible dans le futur, pas avant 1900
do $$ begin
  alter table public.profiles
    add constraint profiles_dob_sane
    check (
      date_of_birth is null
      or (date_of_birth >= '1900-01-01' and date_of_birth <= current_date)
    );
exception when duplicate_object then null; end $$;

-- ============================================================
-- 4. Fonction RPC pour vérifier disponibilité d'un pseudo
-- ============================================================
-- Côté client, on appelle supabase.rpc('check_display_name_available', { p_name: 'foo' })
-- pour vérifier si un pseudo est dispo avant validation.
create or replace function public.check_display_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profiles
    where display_name = p_name::citext
  );
$$;

-- Permission RPC à role authenticated
grant execute on function public.check_display_name_available(text) to authenticated;
