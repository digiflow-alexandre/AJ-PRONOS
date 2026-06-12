-- AJ Pronos — Migration 015 : auto-tracking des combinés foot via API-Football
--
-- Permet au cron track-results de gérer aussi les combinés (et plus uniquement
-- les paris simples). Pour ça, on doit stocker le match_api_fixture_id sur
-- CHAQUE sélection du combo (pas juste au niveau du pari global).
--
-- Logique cron :
--   - Pour chaque combo pending/live, iterate sur ses sélections
--   - Si sel.match_api_fixture_id est set + fixture finished dans table matches
--     → on évalue la sélection (win/loss) et on update sel.result
--   - Si toutes les sélections résolues (win/loss/void) → on agrège :
--     toutes win → combo win, ≥1 loss → combo loss, void mix → void
--   - Sinon (au moins 1 pending) → combo reste pending

-- 1. Ajouter match_api_fixture_id sur les sélections (optionnel — pour
--    saisie manuelle foot ou tennis, reste null → marquage manuel par Julien)
alter table public.published_bet_selections
  add column if not exists match_api_fixture_id integer;

create index if not exists pbs_match_api_fixture_idx
  on public.published_bet_selections (match_api_fixture_id)
  where match_api_fixture_id is not null;
