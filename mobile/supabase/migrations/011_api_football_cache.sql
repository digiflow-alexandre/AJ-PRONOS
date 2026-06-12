-- AJ Pronos — Migration 011 : cache des données API-Football
-- Tables peuplées par les Edge Functions (fetch-matches, refresh-team-stats, track-results)

-- ============================================================
-- 1. TABLE matches — cache des matchs depuis API-Football
-- ============================================================
create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  -- ID API-Football (unique pour upsert + déduplication)
  api_fixture_id      integer not null unique,
  -- Compétition
  api_league_id       integer not null,
  competition_id      text not null,            -- ex 'ligue-1' (match avec competitions.ts)
  competition_label   text not null,            -- ex 'Ligue 1'
  competition_round   text,                     -- ex 'Regular Season - 32' (auto API)
  competition_etape   text,                     -- ex 'J32' (auto extrait du round par notre code)
  sport               text not null default 'foot' check (sport in ('foot', 'tennis')),
  season              integer not null,         -- année saison, ex 2026
  -- Équipes
  team_home           text not null,
  team_home_api_id    integer,
  team_home_logo      text,
  team_away           text not null,
  team_away_api_id    integer,
  team_away_logo      text,
  -- Date / heure
  match_start_at      timestamptz not null,
  venue_name          text,
  venue_city          text,
  -- Status + score (mis à jour par track-results)
  status              text not null default 'scheduled'
                      check (status in ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
  status_short        text,                      -- 'NS' / '1H' / 'HT' / '2H' / 'FT' / 'AET' / 'PEN' / 'PST' / 'CANC' depuis API
  score_home          smallint,
  score_away          smallint,
  -- Métadonnées
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists matches_match_start_idx on public.matches (match_start_at desc);
create index if not exists matches_competition_idx on public.matches (competition_id, match_start_at);
create index if not exists matches_status_idx on public.matches (status);

-- ============================================================
-- 2. TABLE team_stats — cache stats par équipe par saison
-- ============================================================
create table if not exists public.team_stats (
  id                  uuid primary key default gen_random_uuid(),
  api_team_id         integer not null,
  api_league_id       integer not null,
  season              integer not null,
  team_name           text not null,
  team_logo           text,
  -- Forme récente (string des 5 derniers résultats, ex "WWLDW")
  form                text,
  -- Stats globales saison
  played              integer not null default 0,
  wins                integer not null default 0,
  draws               integer not null default 0,
  losses              integer not null default 0,
  goals_for           integer not null default 0,
  goals_against       integer not null default 0,
  -- Classement
  standing_rank       smallint,
  standing_points     smallint,
  updated_at          timestamptz not null default now(),
  unique (api_team_id, api_league_id, season)
);

create index if not exists team_stats_lookup_idx
  on public.team_stats (api_team_id, api_league_id, season);

-- ============================================================
-- 3. Lien published_bets → matches (optionnel, pour traçabilité)
-- ============================================================
alter table public.published_bets
  add column if not exists match_api_fixture_id integer;

create index if not exists published_bets_match_api_idx
  on public.published_bets (match_api_fixture_id)
  where match_api_fixture_id is not null;

-- ============================================================
-- 4. RLS — lecture publique pour tous, écriture admins + service role
-- ============================================================
alter table public.matches enable row level security;
alter table public.team_stats enable row level security;

drop policy if exists "matches_select_all" on public.matches;
create policy "matches_select_all"
  on public.matches for select
  to authenticated
  using (true);

drop policy if exists "team_stats_select_all" on public.team_stats;
create policy "team_stats_select_all"
  on public.team_stats for select
  to authenticated
  using (true);

-- Pas de policy INSERT/UPDATE/DELETE pour authenticated → seules les Edge
-- Functions avec service_role key peuvent écrire (bypass RLS).
-- Les admins peuvent UPDATE manuellement via le dashboard si besoin.

-- ============================================================
-- 5. Triggers updated_at auto
-- ============================================================
drop trigger if exists matches_set_updated_at on public.matches;
create trigger matches_set_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

drop trigger if exists team_stats_set_updated_at on public.team_stats;
create trigger team_stats_set_updated_at
  before update on public.team_stats
  for each row execute function public.set_updated_at();

-- ============================================================
-- 6. Realtime — pour que l'app re-fetch automatiquement quand un match
--    passe en "finished" (et notif push)
-- ============================================================
alter publication supabase_realtime add table public.matches;
