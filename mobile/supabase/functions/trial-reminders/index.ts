// AJ Pronos — Edge Function : trial-reminders
//
// Cron quotidien (idéalement 10h FR) qui :
//   1. Scanne les profiles dont trial_ends_at est entre 23h et 25h dans le futur
//      (≈ J-1, fenêtre tolérante de ±1h)
//   2. Envoie un email "Ton essai gratuit se termine demain" via Resend
//   3. Note l'envoi dans `profiles.trial_reminder_sent_at` pour éviter les doublons
//
// Variables d'env :
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//   - STRIPE_SECRET_KEY (pour récupérer l'email du customer)
//
// Cron suggéré : `0 10 * * *` (toutes les jours à 10h UTC = midi FR)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import {
  buildEmail,
  cta,
  infoCard,
  packCard,
} from '../_shared/email-template.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

const TIER_LABELS: Record<'starter' | 'pro' | 'vip', string> = {
  starter: 'Starter',
  pro: 'Pro',
  vip: 'VIP',
};

const PORTAL_URL = 'https://ajpronos.fr/compte';

async function fetchCustomerEmailFromStripe(customerId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.stripe.com/v1/customers/${customerId}`, {
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.deleted) return null;
    return data.email ?? null;
  } catch {
    return null;
  }
}

function buildHtml(tier: string, _email: string): string {
  const tierAmount = tier === 'VIP' ? '49,90 €' : tier === 'Pro' ? '19,90 €' : '9,90 €';
  const tomorrow = new Date(Date.now() + 86400 * 1000).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const content = `
    ${packCard({
      eyebrow: 'FACTURATION DEMAIN',
      title: tierAmount,
      meta: `Renouvellement automatique le <strong>${tomorrow}</strong>`,
    })}
    ${infoCard({
      variant: 'success',
      html: `<strong>✓ Tu veux continuer ?</strong><br/>Tu n'as <strong>rien à faire</strong>. Les pronos continuent à arriver dans l'app.`,
    })}
    ${infoCard({
      variant: 'neutral',
      html: `<strong>✗ Tu veux arrêter ?</strong><br/>Annule en <strong>1 clic</strong> depuis ton espace abonné. Aucune justification demandée.`,
    })}
    ${cta({
      label: 'Gérer mon abonnement',
      url: PORTAL_URL,
      secondaryText: 'Une question ?',
      secondaryHref: 'mailto:contact@ajpronos.fr',
    })}
  `;

  return buildEmail({
    eyebrow: 'ESSAI GRATUIT',
    title: 'Ton essai se termine demain.',
    titleAccent: 'demain',
    lead: `Salut ! Tes 7 jours offerts sur le pack <strong>${tier}</strong> se terminent dans 24h. À cette date, ton abonnement passera en facturation mensuelle automatique.`,
    content,
    signoff: '<strong>— L\'équipe AJ Pronos</strong>',
  });
}

async function sendReminderEmail(email: string, tier: string): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AJ Pronos <contact@ajpronos.fr>',
      to: email,
      reply_to: 'contact@ajpronos.fr',
      subject: `⏰ Ton essai gratuit se termine demain — AJ Pronos`,
      html: buildHtml(tier, email),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error('[trial-reminders] resend error', res.status, text.slice(0, 300));
    return false;
  }
  return true;
}

serve(async (_req) => {
  // On vise les abonnements dont la fin de trial est dans [23h, 25h] dans le futur.
  // current_period_end stocke la date de fin du trial pour un abo en `trialing`.
  const nowMs = Date.now();
  const minMs = nowMs + 23 * 3600 * 1000;
  const maxMs = nowMs + 25 * 3600 * 1000;
  const minIso = new Date(minMs).toISOString();
  const maxIso = new Date(maxMs).toISOString();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, tier, stripe_customer_id, current_period_end, trial_reminder_sent_at')
    .eq('subscription_status', 'trialing')
    .gte('current_period_end', minIso)
    .lte('current_period_end', maxIso)
    .is('trial_reminder_sent_at', null);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const targets = profiles ?? [];
  let sent = 0;
  let failed = 0;

  for (const p of targets) {
    if (!p.stripe_customer_id || !p.tier) continue;
    const email = await fetchCustomerEmailFromStripe(p.stripe_customer_id);
    if (!email) {
      failed++;
      continue;
    }
    const tierLabel = TIER_LABELS[p.tier as 'starter' | 'pro' | 'vip'] ?? 'AJ Pronos';
    const ok = await sendReminderEmail(email, tierLabel);
    if (ok) {
      sent++;
      await supabase
        .from('profiles')
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq('id', p.id);
    } else {
      failed++;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, scanned: targets.length, sent, failed }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
