-- ============================================================================
-- Migration 016 — Extension du tracking team_stats pour le Stats Center
-- ============================================================================
-- Ajoute :
--   1. Colonnes "saison détaillée" sur team_stats (possession, tirs, cartons…)
--   2. Table team_recent_matches (10 derniers matchs par équipe)
--   3. Table team_head_to_head (confrontations directes, cache 24h)
--
-- Alimenté par l'Edge Function refresh-team-stats (cron 6h) pour les 2
-- premières. La 3ème est remplie à la demande (lookup quand un pari est
-- consulté) par l'Edge Function fetch-h2h.
-- ============================================================================

-- 1. Stats saison détaillées sur team_stats ----------------------------------
alter table public.team_stats
  add column if not exists possession_pct       numeric(5,2),
  add column if not exists shots_per_match      numeric(5,2),
  add column if not exists shots_on_target_per_match numeric(5,2),
  add column if not exists corners_per_match    numeric(5,2),
  add column if not exists free_kicks_per_match numeric(5,2),
  add column if not exists chances_per_match    numeric(5,2),
  add column if not exists clean_sheets         integer,
  add column if not exists yellow_cards         integer,
  add column if not exists red_cards            integer;

-- 2. Table team_recent_matches -----------------------------------------------
create table if not exists public.team_recent_matches (
  id              uuid primary key default gen_random_uuid(),
  api_team_id     integer not null,
  api_league_id   integer not null,
  season          integer not null,
  api_fixture_id  integer not null,
  match_date      timestamptz not null,
  opponent_id     integer not null,
  opponent_name   text not null,
  opponent_logo   text,
  is_home         boolean not null,
  score_for       integer not null,
  score_against   integer not null,
  result          text not null check (result in ('V', 'N', 'D')),
  updated_at      timestamptz not null default now(),
  unique (api_team_id, api_fixture_id)
);

create index if not exists team_recent_matches_team_idx
  on public.team_recent_matches (api_team_id, match_date desc);

-- 3. Table team_head_to_head -------------------------------------------------
create table if not exists public.team_head_to_head (
  id                uuid primary key default gen_random_uuid(),
  /* On stocke la paire ordonnée (low_id, high_id) pour pas dupliquer
     A-vs-B et B-vs-A. La résolution du POV se fait dans l'app. */
  team_low_id       integer not null,
  team_high_id      integer not null,
  api_fixture_id    integer not null,
  match_date        timestamptz not null,
  api_league_id     integer,
  competition       text,
  score_low         integer not null,
  score_high        integer not null,
  /* Méta de cache : quand on a fetché ce h2h pour la dernière fois. */
  fetched_at        timestamptz not null default now(),
  unique (team_low_id, team_high_id, api_fixture_id)
);

create index if not exists team_head_to_head_pair_idx
  on public.team_head_to_head (team_low_id, team_high_id, match_date desc);

-- 4. RLS : lecture publique, écriture service_role uniquement ----------------
alter table public.team_recent_matches enable row level security;
alter table public.team_head_to_head enable row level security;

drop policy if exists "team_recent_matches public read"
  on public.team_recent_matches;
create policy "team_recent_matches public read"
  on public.team_recent_matches
  for select using (true);

drop policy if exists "team_head_to_head public read"
  on public.team_head_to_head;
create policy "team_head_to_head public read"
  on public.team_head_to_head
  for select using (true);
