-- AJ Pronos — Migration 003 : carnet personnel utilisateur
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. TABLE user_bets — paris marqués comme joués par l'utilisateur
-- ============================================================
-- Pour V1, on stocke juste bet_id (string) qui matche l'id du fixture
-- côté app. Quand le backend aura la table `published_bets` en DB, on
-- ajoutera une FK propre.
create table if not exists public.user_bets (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  bet_id            text not null,                              -- id du pari (fixture ou published_bet)
  bet_type          text not null check (bet_type in ('single', 'combo')),
  -- Snapshot des infos du pari au moment où l'user l'a marqué joué
  -- (permet d'afficher le carnet même si le bet est supprimé en DB)
  bet_snapshot      jsonb not null default '{}'::jsonb,
  played_at         timestamptz not null default now(),
  stake             numeric(10, 2),                              -- mise en € (optionnelle)
  notes             text,                                        -- notes perso
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  -- Un user ne peut marquer un même pari qu'une seule fois
  unique (user_id, bet_id)
);

-- Index utile pour lister les paris d'un user par date
create index if not exists user_bets_user_played_idx
  on public.user_bets (user_id, played_at desc);

-- ============================================================
-- 2. RLS — user ne voit/modifie que son propre carnet
-- ============================================================
alter table public.user_bets enable row level security;

drop policy if exists "user_bets_select_own" on public.user_bets;
create policy "user_bets_select_own"
  on public.user_bets for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_bets_insert_own" on public.user_bets;
create policy "user_bets_insert_own"
  on public.user_bets for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "user_bets_update_own" on public.user_bets;
create policy "user_bets_update_own"
  on public.user_bets for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_bets_delete_own" on public.user_bets;
create policy "user_bets_delete_own"
  on public.user_bets for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- 3. TRIGGER : updated_at auto
-- ============================================================
drop trigger if exists user_bets_set_updated_at on public.user_bets;
create trigger user_bets_set_updated_at
  before update on public.user_bets
  for each row execute function public.set_updated_at();
