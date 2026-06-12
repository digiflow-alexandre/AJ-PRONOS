-- AJ Pronos — Migration 019 : Support des classements par groupes
--
-- L'API-Football renvoie les classements en format groupes pour les
-- tournois (Coupe du Monde, Euro, Copa America, etc.) — chaque équipe
-- a un champ `group` indiquant son groupe ("Group A", "Group B", ...).
-- Pour les championnats classiques (Ligue 1, Premier League...), il
-- n'y a qu'un seul groupe et le champ est rempli avec un nom générique
-- (ex: "Ligue 1") ou null.
--
-- On stocke ce groupe pour pouvoir afficher correctement :
--   - Championnat : un seul classement linéaire (1 → N)
--   - Tournoi à groupes : un classement par groupe

alter table public.team_stats
  add column if not exists standing_group text;

create index if not exists team_stats_league_group_idx
  on public.team_stats (api_league_id, standing_group);
