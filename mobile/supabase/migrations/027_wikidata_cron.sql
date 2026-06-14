-- AJ Pronos — Migration 027 : cron mensuel enrich-tennis-players-wikidata
--
-- Les bio statiques (handedness, height, weight, turned_pro_year) bougent
-- très peu. On rafraîchit 1×/mois — assez pour capturer les nouveaux
-- joueurs entrés dans le top 200 ATP/WTA, et corriger éventuelles fixes
-- côté Wikidata.
--
-- Lancement : 1er du mois à 3h UTC (creux d'activité).
-- L'edge function gère son propre TTL interne (30 jours) → re-runs
-- intermédiaires sont no-op.

do $unsched_wikidata$
begin
  perform cron.unschedule('tennis-wikidata-monthly') where exists (
    select 1 from cron.job where jobname = 'tennis-wikidata-monthly'
  );
exception when others then null;
end $unsched_wikidata$;

select cron.schedule(
  'tennis-wikidata-monthly',
  '0 3 1 * *',
  $sched_wikidata$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/enrich-tennis-players-wikidata',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 180000
  );
  $sched_wikidata$
);
