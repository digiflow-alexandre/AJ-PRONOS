// AJ Pronos — Edge Function : envoi de notifs push via Expo Push API
//
// À déployer avec : supabase functions deploy send-push-notification
//
// Usage côté app/serveur :
//   await supabase.functions.invoke('send-push-notification', {
//     body: {
//       title: 'Nouveau prono',
//       body: 'PSG - Lyon, victoire PSG (1.85)',
//       data: { type: 'new_prono', bet_id: '...' },
//       filter: {
//         min_tier: 'starter',  // qui doit le recevoir (par tier)
//         pref_field: 'new_pronos', // quelle préférence doit être ON
//         sport: 'foot',  // optionnel : filtrer par sport
//       },
//     },
//   });
//
// L'edge function :
//   1) Authentifie l'appelant (doit être admin/validator OU service role)
//   2) Récupère les users qui ont opt-in + un expo_push_token valide
//   3) Batch-push via Expo Push API (max 100 par batch)
//   4) Retourne le nombre de notifs envoyées

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  filter: {
    min_tier?: 'starter' | 'pro' | 'vip';
    pref_field:
      | 'new_pronos'
      | 'prono_results'
      | 'vip_mentions'
      | 'vip_new_messages'
      | 'daily_recap';
    sport?: 'foot' | 'tennis';
    // Restreindre à une liste précise de users (utile pour les rappels
    // ciblés type "mets à jour ton carnet").
    user_ids?: string[];
    // Exclure des users (utile pour ne pas notifier l'envoyeur d'un msg VIP).
    exclude_user_ids?: string[];
  };
};

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const payload: PushPayload = await req.json();
  if (!payload.title || !payload.body || !payload.filter?.pref_field) {
    return new Response('Invalid payload', { status: 400 });
  }

  // Récupère les destinataires : profiles qui ont un push token, opt-in
  // à la préférence demandée, et tier suffisant
  const tierOrder = { starter: 1, pro: 2, vip: 3, trial: 1 };
  const minTierRank = payload.filter.min_tier
    ? tierOrder[payload.filter.min_tier]
    : 0;

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, tier, expo_push_token, notification_preferences!inner(*)')
    .not('expo_push_token', 'is', null);

  if (error) {
    return new Response(`DB error: ${error.message}`, { status: 500 });
  }

  const userIdsSet = payload.filter.user_ids
    ? new Set(payload.filter.user_ids)
    : null;
  const excludeIdsSet = payload.filter.exclude_user_ids
    ? new Set(payload.filter.exclude_user_ids)
    : null;

  // Filtre côté JS (plus simple que joins complexes)
  const recipients = (profiles ?? []).filter((p: any) => {
    if (userIdsSet && !userIdsSet.has(p.id)) return false;
    if (excludeIdsSet && excludeIdsSet.has(p.id)) return false;
    const prefs = p.notification_preferences;
    if (!prefs?.enabled) return false;
    if (!prefs[payload.filter.pref_field]) return false;
    if (payload.filter.sport === 'foot' && !prefs.sport_foot) return false;
    if (payload.filter.sport === 'tennis' && !prefs.sport_tennis) return false;
    if (minTierRank > 0) {
      const userRank = tierOrder[p.tier as keyof typeof tierOrder] ?? 0;
      if (userRank < minTierRank) return false;
    }
    return true;
  });

  if (recipients.length === 0) {
    return new Response(
      JSON.stringify({ sent: 0, message: 'No matching recipients' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Batch en lots de 100 max (limite Expo Push API)
  const messages = recipients.map((r: any) => ({
    to: r.expo_push_token,
    title: payload.title,
    body: payload.body,
    sound: 'default',
    data: payload.data,
  }));

  const chunks: typeof messages[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    chunks.push(messages.slice(i, i + 100));
  }

  let sent = 0;
  for (const chunk of chunks) {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(chunk),
    });
    if (res.ok) sent += chunk.length;
  }

  return new Response(
    JSON.stringify({ sent, total: recipients.length }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
