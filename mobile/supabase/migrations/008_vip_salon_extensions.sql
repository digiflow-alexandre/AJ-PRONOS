-- AJ Pronos — Migration 008 : extensions salon VIP (reply, mentions, réactions, reads)

alter table public.vip_messages
  add column if not exists reply_to_message_id uuid references public.vip_messages(id) on delete set null,
  add column if not exists reply_to_snapshot jsonb,
  add column if not exists mentioned_user_ids uuid[] default '{}'::uuid[];

create table if not exists public.vip_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.vip_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  unique (message_id, user_id, emoji)
);

create index if not exists vip_reactions_message_idx
  on public.vip_message_reactions (message_id);

alter table public.vip_message_reactions enable row level security;

drop policy if exists "vip_reactions_select" on public.vip_message_reactions;
create policy "vip_reactions_select" on public.vip_message_reactions for select to authenticated
  using (public.has_vip_salon_access(auth.uid()));

drop policy if exists "vip_reactions_insert" on public.vip_message_reactions;
create policy "vip_reactions_insert" on public.vip_message_reactions for insert to authenticated
  with check (auth.uid() = user_id and public.has_vip_salon_access(auth.uid()));

drop policy if exists "vip_reactions_delete_own" on public.vip_message_reactions;
create policy "vip_reactions_delete_own" on public.vip_message_reactions for delete to authenticated
  using (auth.uid() = user_id);

create table if not exists public.vip_message_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_message_id uuid not null references public.vip_messages(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (user_id)
);

alter table public.vip_message_reads enable row level security;

drop policy if exists "vip_reads_select" on public.vip_message_reads;
create policy "vip_reads_select" on public.vip_message_reads for select to authenticated
  using (public.has_vip_salon_access(auth.uid()));

drop policy if exists "vip_reads_upsert_own" on public.vip_message_reads;
create policy "vip_reads_upsert_own" on public.vip_message_reads for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "vip_reads_update_own" on public.vip_message_reads;
create policy "vip_reads_update_own" on public.vip_message_reads for update to authenticated
  using (auth.uid() = user_id);

create or replace function public.list_vip_participants()
returns table (id uuid, display_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.role
  from public.profiles p
  where (
    p.role in ('admin', 'validator')
    or (p.tier = 'vip' and (p.trial_ends_at is null or p.trial_ends_at > now()))
  )
  and p.display_name is not null
  order by p.role desc, p.display_name asc;
$$;

grant execute on function public.list_vip_participants() to authenticated;

alter publication supabase_realtime add table public.vip_message_reactions;
alter publication supabase_realtime add table public.vip_message_reads;
