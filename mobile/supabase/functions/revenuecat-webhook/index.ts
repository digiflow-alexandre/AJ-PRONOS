// AJ Pronos — Edge Function : revenuecat-webhook
//
// Reçoit les events RevenueCat et synchronise les abonnements iOS + Android
// dans la table `profiles`. Émet aussi les emails transactionnels (bienvenue,
// annulation, paiement échoué) via Resend, comme on le fait pour Stripe.
//
// Events RevenueCat principaux :
//   - INITIAL_PURCHASE      → premier paiement / début de trial
//   - RENEWAL               → renouvellement réussi
//   - CANCELLATION          → l'utilisateur a annulé (mais accès jusqu'à period_end)
//   - EXPIRATION            → abo réellement terminé
//   - BILLING_ISSUE         → renouvellement échoué
//   - PRODUCT_CHANGE        → upgrade / downgrade
//   - UNCANCELLATION        → user a annulé puis re-souscrit
//   - NON_RENEWING_PURCHASE → achat one-time (pas utilisé chez nous)
//
// Variables d'env requises :
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - REVENUECAT_WEBHOOK_SECRET (= "Authorization Header Value" configuré dans
//     RevenueCat Dashboard → Webhooks)
//   - RESEND_API_KEY (pour les emails)
//
// Déploiement :
//   supabase functions deploy revenuecat-webhook --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  buildEmail,
  cta,
  infoCard,
  packCard,
  sectionTitle,
  stepsList,
} from '../_shared/email-template.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

// Mapping entitlement RevenueCat → tier interne AJ Pronos
const ENTITLEMENT_TO_TIER: Record<string, 'starter' | 'pro' | 'vip'> = {
  starter: 'starter',
  pro: 'pro',
  vip: 'vip',
};

const TIER_LABELS: Record<'starter' | 'pro' | 'vip', string> = {
  starter: 'Starter',
  pro: 'Pro',
  vip: 'VIP',
};

const TIER_AMOUNTS: Record<'starter' | 'pro' | 'vip', string> = {
  starter: '9,90 €',
  pro: '19,90 €',
  vip: '49,90 €',
};

type RevenueCatEvent = {
  id: string;
  type: string;
  app_user_id: string;
  original_app_user_id?: string;
  product_id?: string;
  entitlement_id?: string;
  entitlement_ids?: string[];
  expiration_at_ms?: number;
  purchased_at_ms?: number;
  period_type?: 'TRIAL' | 'INTRO' | 'NORMAL' | 'PROMOTIONAL';
  cancel_reason?: string;
  is_trial_conversion?: boolean;
  subscriber_attributes?: Record<string, { value: string }>;
};

type RevenueCatWebhookBody = {
  api_version: string;
  event: RevenueCatEvent;
};

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from('revenuecat_events')
    .select('id')
    .eq('id', eventId)
    .maybeSingle();
  return data !== null;
}

async function recordEvent(event: RevenueCatEvent): Promise<void> {
  await supabase.from('revenuecat_events').insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
}

function tierFromEvent(event: RevenueCatEvent): 'starter' | 'pro' | 'vip' | null {
  // L'event peut avoir un seul entitlement_id ou une liste
  const ids = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  for (const id of ids) {
    const tier = ENTITLEMENT_TO_TIER[id];
    if (tier) return tier;
  }
  return null;
}

function emailFromEvent(event: RevenueCatEvent): string | null {
  // L'email peut être passé via subscriber_attributes['$email'] côté SDK
  const email = event.subscriber_attributes?.['$email']?.value;
  return email ?? null;
}

async function updateProfileFromEvent(
  event: RevenueCatEvent,
  status: 'trialing' | 'active' | 'canceled' | 'past_due' | 'expired',
): Promise<{ profileId: string | null; email: string | null }> {
  const userId = event.app_user_id;
  const tier = tierFromEvent(event);
  const expirationMs = event.expiration_at_ms ?? null;

  // 1. Match par app_user_id (RevenueCat user_id = Supabase user.id en idéal)
  // Si l'app a appelé Purchases.logIn(supabaseUserId), c'est direct.
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!existing) {
    // Le user n'existe pas encore (cas rare, peut arriver si webhook arrive
    // avant que le profile soit créé via le trigger handle_new_user).
    return { profileId: null, email: emailFromEvent(event) };
  }

  await supabase
    .from('profiles')
    .update({
      tier,
      subscription_status: status,
      subscription_source: 'revenuecat',
      revenuecat_user_id: userId,
      revenuecat_original_app_user_id: event.original_app_user_id ?? userId,
      revenuecat_entitlement_id: event.entitlement_id ?? null,
      current_period_end: expirationMs ? new Date(expirationMs).toISOString() : null,
      cancel_at_period_end: status === 'canceled',
    })
    .eq('id', userId);

  return { profileId: userId, email: emailFromEvent(event) };
}

// ============================================================
// Email helpers (réutilisent les templates partagés)
// ============================================================

async function sendWelcomeEmail(email: string, tier: 'starter' | 'pro' | 'vip', isTrialing: boolean): Promise<void> {
  const tierLabel = TIER_LABELS[tier];
  const trialEndsAt = isTrialing
    ? new Date(Date.now() + 7 * 86400 * 1000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const introCopy = isTrialing
    ? `Tes <strong>7 jours offerts</strong> sont activés. Tu as accès à tout le pack Starter pendant 7 jours, sans engagement.`
    : `Bienvenue dans le pack ${tierLabel} d'AJ Pronos.`;

  const content = `
    ${packCard({
      eyebrow: 'TON ABONNEMENT',
      title: `Pack ${tierLabel}`,
      meta: isTrialing
        ? `Essai gratuit jusqu'au <strong>${trialEndsAt}</strong> · Puis ${TIER_AMOUNTS[tier]}/mois`
        : `Renouvellement mensuel automatique`,
    })}
    ${sectionTitle('ET MAINTENANT ?')}
    ${stepsList([
      { title: "Ouvre l'app", desc: 'Les pronos sont disponibles dans l\'écran Accueil' },
      { title: 'Active les notifications', desc: 'Pour recevoir les pronos en temps réel' },
      { title: 'Consulte les analyses', desc: 'Chaque pari a son raisonnement détaillé' },
    ])}
    ${cta({
      label: 'Ouvrir l\'app',
      url: 'https://ajpronos.fr',
      secondaryText: 'Une question ?',
      secondaryHref: 'mailto:contact@ajpronos.fr',
    })}
  `;

  const html = buildEmail({
    eyebrow: 'BIENVENUE',
    title: 'Bienvenue dans la méthode.',
    titleAccent: 'la méthode',
    lead: introCopy,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong><br/>Méthode rigoureuse · Transparence ROI · Sans engagement',
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AJ Pronos <contact@ajpronos.fr>',
      to: email,
      reply_to: 'contact@ajpronos.fr',
      subject: `Bienvenue dans le pack ${tierLabel} — AJ Pronos`,
      html,
    }),
  });
}

async function sendCancellationEmail(email: string, tier: 'starter' | 'pro' | 'vip'): Promise<void> {
  const tierLabel = TIER_LABELS[tier];

  const content = `
    ${packCard({
      eyebrow: 'STATUT',
      title: 'Annulé',
      meta: `Ton accès reste actif jusqu'à la fin de la période en cours`,
    })}
    ${infoCard({
      variant: 'gold',
      html: `<strong>Merci de nous avoir fait confiance.</strong><br/>Si tu veux nous dire ce qui n'a pas collé, <a href="mailto:contact@ajpronos.fr" style="color:#B8941F;">réponds à cet email</a>.`,
    })}
    ${cta({
      label: 'Voir les packs',
      url: 'https://ajpronos.fr/#tarifs',
    })}
  `;

  const html = buildEmail({
    eyebrow: 'ANNULATION CONFIRMÉE',
    title: 'À bientôt, peut-être.',
    titleAccent: 'bientôt',
    lead: `On confirme l'annulation de ton pack <strong>${tierLabel}</strong>.`,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong>',
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AJ Pronos <contact@ajpronos.fr>',
      to: email,
      reply_to: 'contact@ajpronos.fr',
      subject: `Confirmation d'annulation — AJ Pronos`,
      html,
    }),
  });
}

async function sendPaymentFailedEmail(email: string, tier: 'starter' | 'pro' | 'vip'): Promise<void> {
  const tierLabel = TIER_LABELS[tier];

  const content = `
    ${packCard({
      eyebrow: 'MONTANT',
      title: TIER_AMOUNTS[tier],
      meta: `Abonnement Pack ${tierLabel}`,
      titleColor: '#DC2626',
    })}
    ${infoCard({
      variant: 'warning',
      html: `<strong>⏳ L'App Store réessaie automatiquement.</strong> Si le problème persiste, mets à jour ton moyen de paiement dans les Réglages de ton iPhone.`,
    })}
    ${cta({
      label: 'Réglages App Store',
      url: 'https://apps.apple.com/account/billing',
      variant: 'danger',
      secondaryText: "Besoin d'aide ?",
      secondaryHref: 'mailto:contact@ajpronos.fr',
    })}
  `;

  const html = buildEmail({
    variant: 'danger',
    eyebrow: 'PAIEMENT ÉCHOUÉ',
    title: 'Petit souci avec ton paiement.',
    titleAccent: 'ton paiement',
    lead: `Le prélèvement de ton abonnement <strong>${tierLabel}</strong> n'a pas pu aboutir côté App Store.`,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong>',
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'AJ Pronos <contact@ajpronos.fr>',
      to: email,
      reply_to: 'contact@ajpronos.fr',
      subject: `⚠️ Paiement échoué — ton abonnement AJ Pronos`,
      html,
    }),
  });
}

// ============================================================
// Serve
// ============================================================

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // RevenueCat envoie un header `Authorization` avec la valeur configurée
  // dans le dashboard. C'est notre "secret partagé" pour valider l'origine.
  const authHeader = req.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  let body: RevenueCatWebhookBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const event = body.event;
  if (!event || !event.id || !event.type) {
    return new Response('Invalid event', { status: 400 });
  }

  if (await alreadyProcessed(event.id)) {
    return new Response('Already processed', { status: 200 });
  }

  try {
    let result: { profileId: string | null; email: string | null } = { profileId: null, email: null };
    const tier = tierFromEvent(event);

    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
        result = await updateProfileFromEvent(
          event,
          event.period_type === 'TRIAL' || event.period_type === 'INTRO' ? 'trialing' : 'active',
        );
        // Email de bienvenue uniquement sur INITIAL_PURCHASE
        if (event.type === 'INITIAL_PURCHASE' && result.email && tier) {
          try {
            await sendWelcomeEmail(result.email, tier, event.period_type === 'TRIAL');
          } catch (err) {
            console.error('[revenuecat-webhook] welcome email failed', err);
          }
        }
        break;

      case 'CANCELLATION':
        result = await updateProfileFromEvent(event, 'canceled');
        if (result.email && tier) {
          try {
            await sendCancellationEmail(result.email, tier);
          } catch (err) {
            console.error('[revenuecat-webhook] cancellation email failed', err);
          }
        }
        break;

      case 'EXPIRATION':
        result = await updateProfileFromEvent(event, 'expired');
        break;

      case 'BILLING_ISSUE':
        result = await updateProfileFromEvent(event, 'past_due');
        if (result.email && tier) {
          try {
            await sendPaymentFailedEmail(result.email, tier);
          } catch (err) {
            console.error('[revenuecat-webhook] payment-failed email failed', err);
          }
        }
        break;

      case 'PRODUCT_CHANGE':
        // Le tier a changé (upgrade Pro → VIP par exemple)
        result = await updateProfileFromEvent(event, 'active');
        break;

      default:
        // Event non géré (TRANSFER, etc.), on l'enregistre pour debug
        break;
    }

    await recordEvent(event);
    return new Response(JSON.stringify({ ok: true, processed: event.type }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[revenuecat-webhook] error', err);
    const msg = err instanceof Error ? err.message : 'unknown';
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }
});
