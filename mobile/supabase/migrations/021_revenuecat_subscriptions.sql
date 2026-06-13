-- AJ Pronos — Migration 021 : Support des abonnements RevenueCat (iOS + Android)
--
-- Stripe gère les abonnements WEB (via le site ajpronos.fr).
-- RevenueCat gère les abonnements MOBILES (App Store IAP + Google Play Billing).
--
-- Un même user peut techniquement avoir un abo Stripe ET un abo RevenueCat
-- (cas de bord), mais en pratique on prendra la dernière mise à jour comme
-- source de vérité. On ajoute une colonne `subscription_source` pour tracer.

alter table public.profiles
  add column if not exists subscription_source text check (
    subscription_source in ('stripe', 'revenuecat')
  ),
  add column if not exists revenuecat_original_app_user_id text,
  add column if not exists revenuecat_entitlement_id text;

-- Index pour matching rapide par revenuecat_user_id (existait déjà sur la
-- colonne mais autant le confirmer)
create index if not exists profiles_revenuecat_user_id_idx
  on public.profiles (revenuecat_user_id)
  where revenuecat_user_id is not null;

-- ============================================================
-- Table pour les events RevenueCat — idempotence des webhooks
-- ============================================================
create table if not exists public.revenuecat_events (
  id           text primary key,                -- event.id RevenueCat
  type         text not null,                   -- INITIAL_PURCHASE, RENEWAL, CANCELLATION...
  payload      jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.revenuecat_events enable row level security;
-- Aucune policy = pas d'accès direct, seul le service_role peut lire/écrire
-- (utilisé par l'edge function revenuecat-webhook).
