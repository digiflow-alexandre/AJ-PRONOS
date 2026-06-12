-- AJ Pronos — Migration 009 : push notifications + préférences

-- ============================================================
-- 1. Ajouter expo_push_token à profiles
-- ============================================================
alter table public.profiles
  add column if not exists expo_push_token text;

-- ============================================================
-- 2. Table notification_preferences (1 row par user, fine-grained)
-- ============================================================
create table if not exists public.notification_preferences (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  -- Master toggle : si false, on n'envoie RIEN même si user a opté individuellement
  enabled           boolean not null default true,
  -- Types de notif
  new_pronos        boolean not null default true,  -- nouveau prono publié
  prono_results     boolean not null default true,  -- résultats des paris (gagnant/perdant)
  vip_mentions      boolean not null default true,  -- mention @pseudo dans salon VIP
  vip_new_messages  boolean not null default false, -- chaque nouveau message salon (peut spammer)
  daily_recap       boolean not null default true,  -- récap quotidien soir
  -- Filtres par sport
  sport_foot        boolean not null default true,
  sport_tennis      boolean not null default true,
  -- Plages horaires (24h format, ex 22 = 22h)
  quiet_hours_start smallint default 23 check (quiet_hours_start is null or (quiet_hours_start >= 0 and quiet_hours_start <= 23)),
  quiet_hours_end   smallint default 8 check (quiet_hours_end is null or (quiet_hours_end >= 0 and quiet_hours_end <= 23)),
  updated_at        timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notif_prefs_select_own" on public.notification_preferences;
create policy "notif_prefs_select_own" on public.notification_preferences for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notif_prefs_upsert_own" on public.notification_preferences;
create policy "notif_prefs_upsert_own" on public.notification_preferences for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notif_prefs_update_own" on public.notification_preferences;
create policy "notif_prefs_update_own" on public.notification_preferences for update to authenticated
  using (auth.uid() = user_id);

-- Auto-insert d'un row par défaut à la création du profile
create or replace function public.create_default_notif_prefs()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created_create_notif_prefs on public.profiles;
create trigger on_profile_created_create_notif_prefs
  after insert on public.profiles
  for each row execute function public.create_default_notif_prefs();

-- Backfill : crée un row pour les profiles existants
insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- ============================================================
-- 3. Index utile pour lookup destinataires d'une notif
-- ============================================================
create index if not exists profiles_expo_push_token_idx
  on public.profiles(expo_push_token)
  where expo_push_token is not null;
