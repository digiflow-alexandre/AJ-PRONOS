-- AJ Pronos — Migration 010 : soft delete de compte (conformité Apple Guideline 5.1.1.v)

alter table public.profiles
  add column if not exists deleted_at timestamptz;

-- Index pour purge ultérieure (Edge Function quotidienne qui hard-delete
-- les comptes soft-deleted depuis > 30 jours)
create index if not exists profiles_deleted_at_idx
  on public.profiles(deleted_at)
  where deleted_at is not null;
