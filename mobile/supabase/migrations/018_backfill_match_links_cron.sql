-- AJ Pronos — Migration 018 : Cron pour backfill-match-links
--
-- Les paris foot saisis manuellement par Julien n'ont pas de fixture_id
-- API-Football. Sans ce lien, le cron track-results-evening ne sait pas
-- quel match suivre → le résultat ne se met jamais à jour.
--
-- Cette migration ajoute un cron quotidien qui appelle la edge function
-- backfill-match-links pour rattacher les paris orphelins à leur fixture
-- via le nom des équipes + la date + la compétition.
--
-- Schedule : tous les jours à 3h UTC (5h Paris).
-- Pourquoi 3h ? Hors heures de pointe API-Football, et avant le cron
-- track-results-evening qui démarre à 18h FR — comme ça les paris saisis
-- la veille sont déjà rattachés.

do $$
begin
  perform cron.unschedule('backfill-match-links-daily') where exists (
    select 1 from cron.job where jobname = 'backfill-match-links-daily'
  );
exception when others then null;
end $$;

select cron.schedule(
  'backfill-match-links-daily',
  '0 3 * * *',
  $$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/backfill-match-links',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
