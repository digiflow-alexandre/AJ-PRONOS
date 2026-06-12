-- AJ Pronos — Migration 020 : Rappels J-1 fin d'essai
--
-- Ajoute une colonne `trial_reminder_sent_at` à `profiles` pour suivre quels
-- abonnés ont déjà reçu leur email "ton essai se termine demain" et éviter
-- les doublons en cas de re-run du cron.
--
-- Configure aussi le cron quotidien qui appelle l'edge function trial-reminders.

alter table public.profiles
  add column if not exists trial_reminder_sent_at timestamptz;

-- Cron : tous les jours à 10h UTC (= 12h FR en été, 11h FR en hiver)
do $$
begin
  perform cron.unschedule('trial-reminders-daily') where exists (
    select 1 from cron.job where jobname = 'trial-reminders-daily'
  );
exception when others then null;
end $$;

select cron.schedule(
  'trial-reminders-daily',
  '0 10 * * *',
  $$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/trial-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
