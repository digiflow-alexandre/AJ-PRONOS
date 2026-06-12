-- AJ Pronos — Migration 006 : bucket Storage pour les captures bookmaker
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. Créer le bucket public (anti-cache, lecture pour tous)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'bet-screenshots',
  'bet-screenshots',
  true,                     -- bucket public en lecture
  5242880,                  -- max 5 MB par fichier
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ============================================================
-- 2. RLS Storage : lecture publique pour ce bucket
-- ============================================================
drop policy if exists "bet_screenshots_public_read" on storage.objects;
create policy "bet_screenshots_public_read"
  on storage.objects for select
  to authenticated, anon
  using (bucket_id = 'bet-screenshots');

-- ============================================================
-- 3. RLS Storage : écriture / suppression réservées au staff
-- ============================================================
drop policy if exists "bet_screenshots_staff_insert" on storage.objects;
create policy "bet_screenshots_staff_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'bet-screenshots'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  );

drop policy if exists "bet_screenshots_staff_update" on storage.objects;
create policy "bet_screenshots_staff_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'bet-screenshots'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  );

drop policy if exists "bet_screenshots_staff_delete" on storage.objects;
create policy "bet_screenshots_staff_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'bet-screenshots'
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'validator')
    )
  );
