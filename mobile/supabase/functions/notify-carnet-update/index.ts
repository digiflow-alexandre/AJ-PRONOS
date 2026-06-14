// AJ Pronos — Edge Function : notify-carnet-update
//
// Cron quotidien (19h UTC = 21h FR en été). Pour chaque user qui a marqué
// au moins un pari joué dans les 48h dernières, envoie un push "Mets à jour
// ton carnet" l'invitant à saisir résultats/stakes/notes manquants.
//
// V1 ciblage simple :
//   - Tous les users avec ≥ 1 entrée `user_bets` créée dans les dernières 48h
//   - Filtrés ensuite par `send-push-notification` sur la préférence
//     `daily_recap` (l'user peut désactiver dans les paramètres)
//
// Déploiement :
//   supabase functions deploy notify-carnet-update --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Window : paris joués dans les 48h dernières
  const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from('user_bets')
    .select('user_id, played_at')
    .gte('played_at', since);

  if (error) {
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Dédup par user_id + comptage
  const countByUser = new Map<string, number>();
  for (const r of rows ?? []) {
    countByUser.set(r.user_id as string, (countByUser.get(r.user_id as string) ?? 0) + 1);
  }

  if (countByUser.size === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: 'no recent bets to remind', users: 0 }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  const userIds = Array.from(countByUser.keys());

  // On envoie UN push par user pour pouvoir personnaliser le body
  // (nombre de paris suivis). Boucle séquentielle car volume faible
  // (10-100 users en early stage).
  let sent = 0;
  for (const userId of userIds) {
    const count = countByUser.get(userId)!;
    const plural = count > 1 ? 's' : '';
    const body = `${count} pari${plural} suivi${plural} récemment — note tes résultats pour suivre ton ROI perso.`;

    const pushRes = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          title: '📒 Mets à jour ton carnet',
          body,
          data: { type: 'carnet_reminder' },
          filter: {
            pref_field: 'daily_recap',
            user_ids: [userId],
          },
        }),
      },
    );
    if (pushRes.ok) {
      const result = await pushRes.json().catch(() => ({ sent: 0 }));
      sent += (result.sent ?? 0) as number;
    }
  }

  return new Response(
    JSON.stringify({ ok: true, users: userIds.length, sent }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
