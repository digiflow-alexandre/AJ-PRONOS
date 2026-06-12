-- AJ Pronos — Sync abonnements Stripe ↔ profiles
-- Ajoute les colonnes nécessaires sur profiles + tables d'audit / link pending.

-- ============================================================
-- 1. ALTER profiles : colonnes Stripe abonnement
-- ============================================================
alter table public.profiles
  add column if not exists stripe_subscription_id text,
  add column if not exists stripe_price_id        text,
  add column if not exists current_period_end     timestamptz,
  add column if not exists cancel_at_period_end   boolean default false;

create index if not exists profiles_stripe_customer_id_idx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- ============================================================
-- 2. TABLE stripe_events — idempotence des webhooks
-- ============================================================
create table if not exists public.stripe_events (
  id           text primary key,                -- event.id Stripe
  type         text not null,                   -- event.type
  payload      jsonb not null,                  -- event complet
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Aucune policy = aucun client n'y accède directement. Seul le service_role
-- (utilisé par la edge function) y a accès.

-- ============================================================
-- 3. TABLE stripe_pending_links
-- Pour les checkouts faits AVANT que le user crée son compte Supabase :
-- on stocke email → infos abo, et le trigger handle_new_user les attache
-- au profile dès qu'il s'inscrit.
-- ============================================================
create table if not exists public.stripe_pending_links (
  email                     text primary key,
  stripe_customer_id        text not null,
  stripe_subscription_id    text not null,
  stripe_price_id           text,
  tier                      subscription_tier,
  subscription_status       subscription_status,
  current_period_end        timestamptz,
  cancel_at_period_end      boolean default false,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table public.stripe_pending_links enable row level security;
-- Pas de policy : accès uniquement via service_role.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pending_links_set_updated_at on public.stripe_pending_links;
create trigger pending_links_set_updated_at
  before update on public.stripe_pending_links
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. TRIGGER handle_new_user (override) : attache un pending link
-- au profile dès qu'un user s'inscrit avec le même email.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link public.stripe_pending_links%rowtype;
begin
  insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now())
  on conflict (id) do nothing;

  -- Y a-t-il une souscription Stripe orpheline pour cet email ?
  select * into v_link
  from public.stripe_pending_links
  where email = new.email;

  if found then
    update public.profiles
    set stripe_customer_id     = v_link.stripe_customer_id,
        stripe_subscription_id = v_link.stripe_subscription_id,
        stripe_price_id        = v_link.stripe_price_id,
        tier                   = v_link.tier,
        subscription_status    = v_link.subscription_status,
        current_period_end     = v_link.current_period_end,
        cancel_at_period_end   = v_link.cancel_at_period_end,
        updated_at             = now()
    where id = new.id;

    delete from public.stripe_pending_links where email = v_link.email;
  end if;

  return new;
end;
$$;
