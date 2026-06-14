-- AJ Pronos — Migration 023 : schema tennis
--
-- Ajoute la table `tennis_players` (joueurs ATP/WTA singles + paires doubles)
-- et étend la table `matches` avec les colonnes nécessaires au tennis :
--   - surface (Hard / Clay / Grass / Indoor Hard)
--   - round (1/16 finals, Quarter-finals, Semi-finals, Final…)
--   - is_doubles (true pour les matchs en double)
--   - sets_detail (jsonb, tableau brut scores[] de l'API)
--   - winner_side ('home' | 'away' | null) — calculé par fetch-tennis-matches
--   - tennis_statistics (jsonb, statistics[] de l'API : aces, %1ère, BP, etc.)
--
-- Note : `matches.sport` existe déjà depuis migration 011 avec
-- check (sport in ('foot', 'tennis')).

-- ============================================================
-- 1. TABLE tennis_players
-- ============================================================
create table if not exists public.tennis_players (
  id                  uuid primary key default gen_random_uuid(),
  -- Clé API api-tennis.com (player_key, peut représenter un joueur OU une paire)
  api_player_key      text not null unique,
  -- Identité
  name                text not null,                    -- "N. Djokovic" ou "Cervantes Tomas/ Ferrer Adria"
  full_name           text,                             -- "Novak Djokovic" (via get_players)
  country             text,                             -- "Serbia"
  is_pair             boolean not null default false,   -- true = paire de double
  gender              text check (gender in ('M', 'F', 'MIXED')),
  -- Circuit (où on l'a vu le plus récemment)
  circuit             text check (
    circuit in ('ATP', 'WTA', 'ATP_DOUBLES', 'WTA_DOUBLES', 'MIXED_DOUBLES', 'CHALLENGER', 'ITF')
  ),
  -- Classement
  ranking             integer,                          -- ATP/WTA singles place
  ranking_points      integer,
  ranking_movement    text check (ranking_movement in ('up', 'down', 'same')),
  -- Bio (depuis l'API)
  birthday            date,                             -- player_bday parsé (DD.MM.YYYY)
  logo_url            text,                             -- player_logo
  -- Bio enrichie (depuis Wikidata, voir enrich-tennis-players-wikidata)
  handedness          text check (handedness in ('left', 'right', 'ambidextrous')),
  backhand            text check (backhand in ('one-handed', 'two-handed')),
  height_cm           integer,
  weight_kg           integer,
  turned_pro_year     integer,
  wikidata_qid        text,                             -- ex 'Q10393' (Djokovic) pour re-sync
  wikidata_synced_at  timestamptz,
  -- Stats agrégées (calculées depuis stats[] de l'API + cron)
  career_titles       integer,
  career_win_rate     numeric(5, 2),                    -- ex 82.45
  career_hard_win_rate  numeric(5, 2),
  career_clay_win_rate  numeric(5, 2),
  career_grass_win_rate numeric(5, 2),
  season_titles       integer,
  season_win_rate     numeric(5, 2),
  season_hard_win_rate  numeric(5, 2),
  season_clay_win_rate  numeric(5, 2),
  season_grass_win_rate numeric(5, 2),
  -- Dump brut des stats[] et tournaments[] de l'API (utile pour debug + recalcul)
  raw_stats           jsonb,                            -- stats[] de get_players
  raw_tournaments     jsonb,                            -- tournaments[] de get_players
  -- Métadonnées
  api_synced_at       timestamptz,                      -- dernier appel get_players
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists tennis_players_ranking_idx
  on public.tennis_players (circuit, ranking)
  where ranking is not null;

create index if not exists tennis_players_name_search_idx
  on public.tennis_players using gin (to_tsvector('simple', coalesce(full_name, name)));

create index if not exists tennis_players_country_idx
  on public.tennis_players (country);

alter table public.tennis_players enable row level security;

-- Lecture publique (les joueurs sont des données publiques, comme les équipes foot)
drop policy if exists "tennis_players_select_all" on public.tennis_players;
create policy "tennis_players_select_all"
  on public.tennis_players for select
  to authenticated, anon
  using (true);

-- Pas de write policy : seul le service_role écrit (via les edge functions)

drop trigger if exists tennis_players_set_updated_at on public.tennis_players;
create trigger tennis_players_set_updated_at
  before update on public.tennis_players
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2. EXTENSION table matches (colonnes tennis)
-- ============================================================
alter table public.matches
  add column if not exists surface text check (
    surface in ('hard', 'clay', 'grass', 'hard_indoor', 'carpet')
  ),
  add column if not exists round text,                     -- ex 'Quarter-finals'
  add column if not exists is_doubles boolean default false,
  add column if not exists sets_detail jsonb,              -- tableau [{score_first, score_second, score_set}]
  add column if not exists winner_side text check (winner_side in ('home', 'away')),
  add column if not exists tennis_statistics jsonb;        -- statistics[] de l'API tennis

-- Le tracker tennis filtre sur sport + status, donc index utile :
create index if not exists matches_tennis_pending_idx
  on public.matches (sport, status, match_start_at)
  where sport = 'tennis';

-- ============================================================
-- 3. ASSOUPLISSEMENT contraintes foot-only (api_league_id NOT NULL)
-- ============================================================
-- Le tennis n'utilise pas api_league_id (concept foot/API-Football).
-- On rend la colonne nullable. Les rows foot existantes restent intactes.
alter table public.matches
  alter column api_league_id drop not null;
