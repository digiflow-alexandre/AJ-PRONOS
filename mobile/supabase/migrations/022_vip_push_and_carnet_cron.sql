-- AJ Pronos — Migration 022 : trigger push messages VIP + cron rappel carnet
--
-- 1) Trigger AFTER INSERT sur vip_messages → appelle notify-vip-message
--    pour pousser un push à tous les VIPs (sauf l'envoyeur) qui ont opt-in.
-- 2) Cron quotidien (19h UTC / 21h FR été) → appelle notify-carnet-update
--    pour rappeler aux users de saisir résultats/stakes/notes manquants.
--
-- Pré-requis (déjà OK depuis migration 012) :
--   - extension pg_net activée
--   - extension pg_cron activée
--   - app.service_role_key set au niveau de la database

-- ============================================================
-- 1. TRIGGER : push notif après insert dans vip_messages
-- ============================================================
create or replace function public.notify_vip_message_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
  -- On skip les messages soft-deleted dès l'insert (rare, défense en
  -- profondeur) et les messages système (rejoin / quit).
  if new.deleted_at is not null or new.message_type <> 'text' then
    return new;
  end if;

  perform net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/notify-vip-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := jsonb_build_object('message_id', new.id)
  );

  return new;
end;
$func$;

drop trigger if exists vip_messages_notify_push on public.vip_messages;
create trigger vip_messages_notify_push
  after insert on public.vip_messages
  for each row execute function public.notify_vip_message_push();

-- ============================================================
-- 2. CRON : rappel quotidien carnet (19h UTC = 21h FR été)
-- ============================================================
do $body$
begin
  perform cron.unschedule('carnet-reminder-daily') where exists (
    select 1 from cron.job where jobname = 'carnet-reminder-daily'
  );
exception when others then null;
end $body$;

select cron.schedule(
  'carnet-reminder-daily',
  '0 19 * * *',
  $body$
  select net.http_post(
    url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/notify-carnet-update',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $body$
);
