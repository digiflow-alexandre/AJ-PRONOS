-- AJ Pronos — Migration 005 : pronos publiés par Julien (admin)
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. ENUMs (résultats + statut publication)
-- ============================================================
do $$ begin
  create type bet_result as enum ('pending', 'live', 'win', 'loss', 'void');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bet_kind as enum ('single', 'combo');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2. TABLE published_bets — un pari publié (simple ou combiné)
-- ============================================================
create table if not exists public.published_bets (
  id                       uuid primary key default gen_random_uuid(),
  kind                     bet_kind not null,
  min_tier                 subscription_tier not null default 'starter',
  -- Indice de confiance Julien (1-5)
  confidence               smallint not null default 3 check (confidence >= 1 and confidence <= 5),
  -- Analyse Julien (texte long, pour simple ou combiné global)
  reasoning                text not null default '',
  -- Cote totale (= produit des cotes des sélections, stocké pour cohérence)
  total_odd                numeric(8, 2) not null,
  -- Capture d'écran du ticket bookmaker (URL Supabase Storage, optionnel V1)
  bookmaker_screenshot_url text,
  bookmaker_name           text, -- "Winamax", "Unibet", etc.
  -- Résultat global (calculé manuellement par admin OU agent tracking)
  result                   bet_result not null default 'pending',
  -- Publication
  published_at             timestamptz not null default now(),
  published_by             uuid not null references auth.users(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists published_bets_published_at_idx
  on public.published_bets (published_at desc);
create index if not exists published_bets_min_tier_idx
  on public.published_bets (min_tier);

-- ============================================================
-- 3. TABLE published_bet_selections — sélections d'un pari
-- ============================================================
-- Pour un SIMPLE : 1 ligne (l'unique sélection)
-- Pour un COMBO  : N lignes (les N sélections)
create table if not exists public.published_bet_selections (
  id                  uuid primary key default gen_random_uuid(),
  published_bet_id    uuid not null references public.published_bets(id) on delete cascade,
  -- Ordre d'affichage (0 = première sélection)
  position            smallint not null default 0,
  -- Données du match
  sport               text not null check (sport in ('foot', 'tennis')),
  competition         text not null,
  team_home           text not null,
  team_away           text not null,
  team_home_logo      text,
  team_away_logo      text,
  match_start_at      timestamptz not null,
  -- Le pari sur ce match
  prediction          text not null,
  odd                 numeric(6, 2) not null check (odd > 1),
  -- Mini-analyse (utilisée pour les sélections de combo)
  mini_reasoning      text default '',
  -- Résultat de cette sélection
  result              bet_result not null default 'pending',
  final_score         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists pbs_published_bet_idx
  on public.published_bet_selections (published_bet_id, position);
create index if not exists pbs_match_start_idx
  on public.published_bet_selections (match_start_at desc);

-- ============================================================
-- 4. RLS — lecture publique pour les abonnés, écriture pour les admins
-- ============================================================
alter table public.published_bets enable row level security;
alter table public.published_bet_selections enable row level security;

-- SELECT : tous les utilisateurs authentifiés peuvent lire (le filtrage
-- par tier se fait côté app via canAccess)
drop policy if exists "published_bets_select_all" on public.published_bets;
create policy "published_bets_select_all"
  on public.published_bets for select
  to authenticated
  using (true);

drop policy if exists "pbs_select_all" on public.published_bet_selections;
create policy "pbs_select_all"
  on public.published_bet_selections for select
  to authenticated
  using (true);

-- INSERT / UPDATE / DELETE : uniquement admin ou validator
drop policy if exists "published_bets_write_staff" on public.published_bets;
create policy "published_bets_write_staff"
  on public.published_bets for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  );

drop policy if exists "pbs_write_staff" on public.published_bet_selections;
create policy "pbs_write_staff"
  on public.published_bet_selections for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  );

-- ============================================================
-- 5. TRIGGERS : updated_at auto
-- ============================================================
drop trigger if exists published_bets_set_updated_at on public.published_bets;
create trigger published_bets_set_updated_at
  before update on public.published_bets
  for each row execute function public.set_updated_at();

drop trigger if exists pbs_set_updated_at on public.published_bet_selections;
create trigger pbs_set_updated_at
  before update on public.published_bet_selections
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. (Realtime) — publier les changements pour push live UI
-- ============================================================
-- Optionnel : activer Realtime sur ces tables pour que l'app refresh
-- automatiquement quand Julien publie un nouveau prono.
-- Cette commande peut être faite via Dashboard → Database → Replication
-- ou en SQL avec :
-- alter publication supabase_realtime add table public.published_bets;
-- alter publication supabase_realtime add table public.published_bet_selections;
