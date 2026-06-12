// AJ Pronos — Edge Function : stripe-webhook
//
// Reçoit les événements Stripe et synchronise les abonnements dans la table
// `profiles`. Si le client n'a pas encore de compte Supabase (paiement avant
// inscription), on stocke l'info dans `stripe_pending_links` indexée par email.
// Le trigger `handle_new_user` la rattachera au profile lors de l'inscription.
//
// Events gérés :
//   - checkout.session.completed         → cas premier paiement
//   - customer.subscription.created      → nouvel abo (souvent doublon checkout)
//   - customer.subscription.updated      → changement de plan, renew, cancel-at-period-end
//   - customer.subscription.deleted      → abo terminé / annulé immédiat
//   - invoice.payment_failed             → past_due
//
// Variables d'environnement requises (Supabase Vault / secrets) :
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - STRIPE_SECRET_KEY
//   - STRIPE_WEBHOOK_SECRET
//
// Déploiement :
//   supabase functions deploy stripe-webhook --no-verify-jwt
//   (--no-verify-jwt car Stripe n'envoie pas de JWT Supabase)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import Stripe from 'https://esm.sh/stripe@17.5.0?target=deno';
import {
  buildEmail,
  cta,
  infoCard,
  packCard,
  sectionTitle,
  stepsList,
} from '../_shared/email-template.ts';

const PRICE_ID_TO_TIER: Record<string, 'starter' | 'pro' | 'vip'> = {
  price_1TgtI2IDhceiaGQOZDkORhsd: 'starter',
  price_1TgtNDIDhceiaGQOy8di0JSE: 'pro',
  price_1TgtP8IDhceiaGQOl1EQtmMU: 'vip',
};

const TIER_LABELS: Record<'starter' | 'pro' | 'vip', string> = {
  starter: 'Starter',
  pro: 'Pro',
  vip: 'VIP',
};

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const stripe = new Stripe(stripeSecret, {
  apiVersion: '2026-05-27.dahlia',
  httpClient: Stripe.createFetchHttpClient(),
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const supabase = createClient(supabaseUrl, serviceKey);

type StripeSubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

type ProfileStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';

function mapStatus(status: StripeSubscriptionStatus): ProfileStatus {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'active':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    default:
      return 'expired';
  }
}

function tierFromPriceId(priceId: string | null | undefined): 'starter' | 'pro' | 'vip' | null {
  if (!priceId) return null;
  return PRICE_ID_TO_TIER[priceId] ?? null;
}

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const { data } = await supabase.from('stripe_events').select('id').eq('id', eventId).maybeSingle();
  return data !== null;
}

async function recordEvent(event: Stripe.Event): Promise<void> {
  await supabase.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    payload: event as unknown as Record<string, unknown>,
  });
}

async function upsertSubscription(params: {
  email: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  status: ProfileStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}): Promise<void> {
  const tier = tierFromPriceId(params.stripePriceId);

  const updateFields = {
    stripe_customer_id: params.stripeCustomerId,
    stripe_subscription_id: params.stripeSubscriptionId,
    stripe_price_id: params.stripePriceId,
    tier,
    subscription_status: params.status,
    current_period_end: params.currentPeriodEnd,
    cancel_at_period_end: params.cancelAtPeriodEnd,
  };

  // 1. Le user existe-t-il déjà sur Supabase ?
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', params.stripeCustomerId)
    .maybeSingle();

  if (existing) {
    await supabase.from('profiles').update(updateFields).eq('id', existing.id);
    return;
  }

  // 2. Sinon, lookup par email dans auth.users via service role
  const { data: userByEmail } = await supabase.auth.admin.listUsers();
  const matchedUser = userByEmail?.users.find(
    (u) => u.email?.toLowerCase() === params.email.toLowerCase()
  );

  if (matchedUser) {
    await supabase.from('profiles').update(updateFields).eq('id', matchedUser.id);
    return;
  }

  // 3. Aucun user trouvé : pending link en attendant l'inscription.
  await supabase.from('stripe_pending_links').upsert(
    {
      email: params.email.toLowerCase(),
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      stripe_price_id: params.stripePriceId,
      tier,
      subscription_status: params.status,
      current_period_end: params.currentPeriodEnd,
      cancel_at_period_end: params.cancelAtPeriodEnd,
    },
    { onConflict: 'email' }
  );
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  // On a besoin de l'email pour le matching côté Supabase.
  const customer = await stripe.customers.retrieve(stripeCustomerId);
  if (customer.deleted) return;
  const email = customer.email;
  if (!email) return;

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const status = mapStatus(subscription.status as StripeSubscriptionStatus);
  const periodEnd = subscription.items.data[0]?.current_period_end ?? null;

  await upsertSubscription({
    email,
    stripeCustomerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const stripeCustomerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  await supabase
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      cancel_at_period_end: false,
    })
    .eq('stripe_customer_id', stripeCustomerId);

  // Email de confirmation d'annulation (best-effort)
  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (!customer.deleted && customer.email) {
      const priceId = subscription.items.data[0]?.price.id ?? null;
      const tier = tierFromPriceId(priceId);
      await sendCancellationEmail(customer.email, tier);
    }
  } catch (err) {
    console.error('[stripe-webhook] cancellation email failed', err);
  }
}

async function sendWelcomeEmail(email: string, tier: 'starter' | 'pro' | 'vip'): Promise<void> {
  const tierLabel = TIER_LABELS[tier];
  const isTrialing = tier === 'starter';
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
        ? `Essai gratuit jusqu'au <strong>${trialEndsAt}</strong> · Puis 9,90 €/mois`
        : `Renouvellement mensuel automatique`,
    })}
    ${sectionTitle('ET MAINTENANT ?')}
    ${stepsList([
      { title: "Télécharge l'app", desc: 'Disponible sur App Store et Google Play' },
      { title: 'Connecte-toi', desc: `Avec ton email <strong>${email}</strong>` },
      { title: 'Active les notifications', desc: 'Pour recevoir les pronos en temps réel' },
    ])}
    ${cta({
      label: "Télécharger l'app",
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

  const res = await fetch('https://api.resend.com/emails', {
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
  if (!res.ok) {
    const text = await res.text();
    console.error('[stripe-webhook] welcome email error', res.status, text);
  }
}

/**
 * Email envoyé quand un paiement échoue (carte expirée, fonds insuffisants…).
 * On donne au client un lien direct vers le Customer Portal pour mettre à jour
 * son moyen de paiement avant que Stripe ne tente le retry suivant.
 */
async function sendPaymentFailedEmail(
  email: string,
  tier: 'starter' | 'pro' | 'vip' | null,
): Promise<void> {
  const tierLabel = tier ? TIER_LABELS[tier] : 'AJ Pronos';
  const tierAmount = tier === 'vip' ? '49,90 €' : tier === 'pro' ? '19,90 €' : '9,90 €';

  const content = `
    ${packCard({
      eyebrow: 'MONTANT',
      title: tierAmount,
      meta: `Abonnement Pack ${tierLabel}`,
      titleColor: '#DC2626',
    })}
    ${sectionTitle('CAUSES POSSIBLES')}
    ${stepsList([
      { num: '•', title: 'Carte expirée', desc: 'Mets à jour ton moyen de paiement' },
      { num: '•', title: 'Plafond atteint', desc: 'Vérifie ton plafond avec ta banque' },
      { num: '•', title: 'Solde insuffisant', desc: 'Réessaie après avoir rechargé' },
    ])}
    ${infoCard({
      variant: 'warning',
      html: `<strong>⏳ Tu as quelques jours</strong> pour mettre à jour ta carte avant que ton abonnement soit suspendu. On va retenter le prélèvement automatiquement.`,
    })}
    ${cta({
      label: 'Mettre à jour ma carte',
      url: 'https://ajpronos.fr/compte',
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
    lead: `Le prélèvement pour ton abonnement <strong>${tierLabel}</strong> n'a pas pu aboutir.`,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong>',
  });

  const res = await fetch('https://api.resend.com/emails', {
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
  if (!res.ok) {
    const text = await res.text();
    console.error('[stripe-webhook] payment-failed email error', res.status, text);
  }
}

/**
 * Email envoyé quand un abonnement est définitivement annulé (fin de période
 * ou annulation immédiate côté admin). On garde une porte ouverte : lien pour
 * relancer un abonnement en 1 clic + on remercie sans drama.
 */
async function sendCancellationEmail(
  email: string,
  tier: 'starter' | 'pro' | 'vip' | null,
): Promise<void> {
  const tierLabel = tier ? TIER_LABELS[tier] : 'AJ Pronos';
  const endDate = new Date(Date.now() + 30 * 86400 * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const content = `
    ${packCard({
      eyebrow: 'STATUT',
      title: 'Annulé',
      meta: `Accès jusqu'au <strong>${endDate}</strong>, fin de période en cours`,
    })}
    ${infoCard({
      variant: 'gold',
      html: `<strong>Merci de nous avoir fait confiance.</strong><br/>Si tu veux nous dire ce qui n'a pas collé, <a href="mailto:contact@ajpronos.fr" style="color:#B8941F;">réponds à cet email</a> — chaque retour nous aide à améliorer le service.`,
    })}
    ${sectionTitle("ÇA T'INTÉRESSERA PEUT-ÊTRE")}
    ${stepsList([
      { num: '↻', title: 'Reprendre un abonnement', desc: 'Voir nos packs Starter / Pro / VIP' },
      { num: '📊', title: 'Suivre nos résultats publics', desc: 'Gains et pertes affichés en transparence' },
    ])}
    ${cta({
      label: 'Voir les packs',
      url: 'https://ajpronos.fr/#tarifs',
      secondaryText: 'Une dernière question ?',
      secondaryHref: 'mailto:contact@ajpronos.fr',
    })}
  `;

  const html = buildEmail({
    eyebrow: 'ANNULATION CONFIRMÉE',
    title: 'À bientôt, peut-être.',
    titleAccent: 'bientôt',
    lead: `On confirme l'annulation de ton pack <strong>${tierLabel}</strong>. Plus aucun prélèvement ne sera effectué.`,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong>',
  });

  const res = await fetch('https://api.resend.com/emails', {
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
  if (!res.ok) {
    const text = await res.text();
    console.error('[stripe-webhook] cancellation email error', res.status, text);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== 'subscription') return;
  if (!session.subscription) return;

  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subId);
  await handleSubscriptionChange(subscription);

  // Email de bienvenue (best-effort : on n'échoue pas le webhook si l'email part pas).
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const priceId = subscription.items.data[0]?.price.id ?? null;
  const tier = tierFromPriceId(priceId);
  if (email && tier) {
    try {
      await sendWelcomeEmail(email, tier);
    } catch (err) {
      console.error('[stripe-webhook] welcome email failed', err);
    }
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing signature', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret, undefined, cryptoProvider);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'invalid signature';
    return new Response(`Invalid signature: ${msg}`, { status: 400 });
  }

  if (await alreadyProcessed(event.id)) {
    return new Response('Already processed', { status: 200 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null };
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription.id;
          const sub = await stripe.subscriptions.retrieve(subId);
          await handleSubscriptionChange(sub);

          // Email de notification d'échec (best-effort)
          try {
            const customerId =
              typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
            const customer = await stripe.customers.retrieve(customerId);
            if (!customer.deleted && customer.email) {
              const priceId = sub.items.data[0]?.price.id ?? null;
              const tier = tierFromPriceId(priceId);
              await sendPaymentFailedEmail(customer.email, tier);
            }
          } catch (err) {
            console.error('[stripe-webhook] payment-failed email failed', err);
          }
        }
        break;
      }
      default:
        // Event non géré, on l'enregistre quand même pour debug.
        break;
    }

    await recordEvent(event);
    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('[stripe-webhook] error', err);
    const msg = err instanceof Error ? err.message : 'unknown error';
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }
});
