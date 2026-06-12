-- AJ Pronos — Migration 007 : salon VIP (chat groupe + coaching privé)
-- À coller dans Supabase Dashboard → SQL Editor → New query → Run

-- ============================================================
-- 1. TABLE vip_messages — messages du salon de groupe VIP
-- ============================================================
create table if not exists public.vip_messages (
  id                 uuid primary key default gen_random_uuid(),
  sender_id          uuid references auth.users(id) on delete set null,
  -- Snapshot du display_name au moment de l'envoi (pour garder l'historique
  -- si l'user change de pseudo plus tard)
  sender_display_name text,
  -- Snapshot du rôle au moment de l'envoi : 'user' / 'validator' / 'admin'
  sender_role        text not null default 'user',
  content            text not null,
  message_type       text not null default 'text' check (message_type in ('text', 'system')),
  -- Soft delete (modération)
  deleted_at         timestamptz,
  deleted_by         uuid references auth.users(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists vip_messages_created_at_idx
  on public.vip_messages (created_at desc);

-- ============================================================
-- 2. RLS — lecture & écriture uniquement pour tier VIP + staff
-- ============================================================
alter table public.vip_messages enable row level security;

-- Helper : est-ce que l'user a accès au salon VIP ?
-- (= tier='vip' ET trial pas expiré, OU role='admin'/'validator')
create or replace function public.has_vip_salon_access(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
    and (
      p.role in ('admin', 'validator')
      or (
        p.tier = 'vip'
        and (p.trial_ends_at is null or p.trial_ends_at > now())
      )
    )
  );
$$;

drop policy if exists "vip_messages_select" on public.vip_messages;
create policy "vip_messages_select"
  on public.vip_messages for select
  to authenticated
  using (public.has_vip_salon_access(auth.uid()));

drop policy if exists "vip_messages_insert" on public.vip_messages;
create policy "vip_messages_insert"
  on public.vip_messages for insert
  to authenticated
  with check (
    public.has_vip_salon_access(auth.uid())
    and auth.uid() = sender_id
  );

-- UPDATE réservé aux admins (pour soft delete via deleted_at)
drop policy if exists "vip_messages_update_staff" on public.vip_messages;
create policy "vip_messages_update_staff"
  on public.vip_messages for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'validator')
    )
  );

-- DELETE physique réservé aux admins (rare, soft delete préféré)
drop policy if exists "vip_messages_delete_admin" on public.vip_messages;
create policy "vip_messages_delete_admin"
  on public.vip_messages for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 3. TRIGGER : updated_at auto
-- ============================================================
drop trigger if exists vip_messages_set_updated_at on public.vip_messages;
create trigger vip_messages_set_updated_at
  before update on public.vip_messages
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. TABLE coaching_threads — fils privés VIP ↔ Julien
-- ============================================================
create table if not exists public.coaching_threads (
  id          uuid primary key default gen_random_uuid(),
  vip_id      uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'open' check (status in ('open', 'closed')),
  -- Snapshot pseudo VIP au moment de la demande (pratique côté admin)
  vip_display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- Un VIP ne peut avoir qu'UN seul thread "open" à la fois (anti-spam)
  unique (vip_id, status) deferrable initially deferred
);

create index if not exists coaching_threads_vip_idx
  on public.coaching_threads (vip_id, status);

alter table public.coaching_threads enable row level security;

-- SELECT : le VIP voit son propre thread, les admins voient tous les threads
drop policy if exists "coaching_threads_select" on public.coaching_threads;
create policy "coaching_threads_select"
  on public.coaching_threads for select
  to authenticated
  using (
    auth.uid() = vip_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'validator')
    )
  );

-- INSERT : seul un VIP avec accès salon peut créer son thread
drop policy if exists "coaching_threads_insert_vip" on public.coaching_threads;
create policy "coaching_threads_insert_vip"
  on public.coaching_threads for insert
  to authenticated
  with check (
    auth.uid() = vip_id
    and public.has_vip_salon_access(auth.uid())
  );

-- UPDATE : VIP peut fermer son propre thread, admins peuvent tout
drop policy if exists "coaching_threads_update" on public.coaching_threads;
create policy "coaching_threads_update"
  on public.coaching_threads for update
  to authenticated
  using (
    auth.uid() = vip_id
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'validator')
    )
  );

drop trigger if exists coaching_threads_set_updated_at on public.coaching_threads;
create trigger coaching_threads_set_updated_at
  before update on public.coaching_threads
  for each row execute function public.set_updated_at();

-- ============================================================
-- 5. TABLE coaching_messages — messages dans un fil coaching
-- ============================================================
create table if not exists public.coaching_messages (
  id                 uuid primary key default gen_random_uuid(),
  thread_id          uuid not null references public.coaching_threads(id) on delete cascade,
  sender_id          uuid not null references auth.users(id) on delete set null,
  sender_role        text not null default 'user',
  content            text not null,
  created_at         timestamptz not null default now()
);

create index if not exists coaching_messages_thread_idx
  on public.coaching_messages (thread_id, created_at asc);

alter table public.coaching_messages enable row level security;

-- SELECT : VIP voit ses messages, admins voient tout
drop policy if exists "coaching_messages_select" on public.coaching_messages;
create policy "coaching_messages_select"
  on public.coaching_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.coaching_threads t
      where t.id = thread_id
      and (
        t.vip_id = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'validator')
        )
      )
    )
  );

-- INSERT : VIP peut envoyer dans son propre thread, admins partout
drop policy if exists "coaching_messages_insert" on public.coaching_messages;
create policy "coaching_messages_insert"
  on public.coaching_messages for insert
  to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.coaching_threads t
      where t.id = thread_id
      and (
        t.vip_id = auth.uid()
        or exists (
          select 1 from public.profiles
          where id = auth.uid() and role in ('admin', 'validator')
        )
      )
    )
  );
