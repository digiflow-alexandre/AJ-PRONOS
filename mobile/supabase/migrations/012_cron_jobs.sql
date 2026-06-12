-- AJ Pronos — Migration 012 : Cron jobs pour Edge Functions API-Football
--
-- Configure pg_cron pour appeler automatiquement nos 3 Edge Functions :
--   - fetch-matches : tous les jours à 6h UTC (8h Paris)
--   - refresh-team-stats : toutes les 6h
--   - track-results : toutes les 10 min de 16h à 23h UTC (18h-01h Paris)
--
-- Pré-requis (à faire UNE FOIS dans Dashboard Supabase) :
--   Database → Extensions → activer "pg_cron" et "pg_net"
--   Project Settings → API → copier l'URL et la service_role key

-- Active les extensions si pas déjà fait
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Helper : on stocke l'URL et la clé en settings GUC pour pas les hardcoder
-- (à set via le Dashboard SQL Editor : alter database postgres set "app.supabase_url" = '...';)
-- Mais pour simplifier, on hardcode ici l'URL projet (la clé est lue depuis la fonction).

-- Si tu as déjà des jobs avec ces noms, on les supprime avant
do $$
begin
  perform cron.unschedule('fetch-matches-daily') where exists (
    select 1 from cron.job where jobname = 'fetch-matches-daily'
  );
  perform cron.unschedule('refresh-team-stats-6h') where exists (
    select 1 from cron.job where jobname = 'refresh-team-stats-6h'
  );
  perform cron.unschedule('track-results-evening') where exists (
    select 1 from cron.job where jobname = 'track-results-evening'
  );
exception when others then null;
end $$;

-- Job 1 : fetch-matches — tous les jours à 6h UTC (8h Paris)
select cron.schedule(
  'fetch-matches-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/fetch-matches',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Job 2 : refresh-team-stats — toutes les 6h
select cron.schedule(
  'refresh-team-stats-6h',
  '0 */6 * * *',
  $$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/refresh-team-stats',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Job 3 : track-results — toutes les 10 min de 16h à 23h UTC (18h-01h Paris)
-- (couvre les matchs européens du soir + nuit US/Mondial)
select cron.schedule(
  'track-results-evening',
  '*/10 16-23 * * *',
  $$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/track-results',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Vérification : pour voir les jobs créés
-- select jobname, schedule, active from cron.job;
