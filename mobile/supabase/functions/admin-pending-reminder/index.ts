// AJ Pronos — Edge Function : admin-pending-reminder
//
// Envoie une notif push aux admins (Alex + Julien) pour les rappeler de :
//   - Valider manuellement les paris dont le résultat est en `void` mais
//     dont le match est fini (prédiction non parsable par track-results)
//   - Régler les paris tennis qui sont passés (pas d'API tennis = manuel obligatoire)
//   - Régler les paris foot saisis manuellement (pas de fixture_id = manuel)
//
// Cron recommandé :
//   - '0 23 * * *' (23h UTC = 1h du matin FR) — bilan de fin de journée
//   - '0 10 * * *' (10h UTC = midi FR) — rappel matin pour la veille
//
// L'idée : si Julien oublie de marquer un pari, il reçoit une push qui lui
// rappelle ce qu'il a à faire avec un compteur précis. Tap → ouvre l'admin.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const nowMs = Date.now();
  // On considère un match "fini" si match_start_at < now - 1h30 (laisse marge tennis)
  const cutoffIso = new Date(nowMs - 90 * 60 * 1000).toISOString();

  // 1) Liste les SÉLECTIONS qui devraient être résolues mais sont en pending
  //    OU void (prédiction non parsable côté track-results).
  //    On groupe par bet_id pour le compteur.
  const { data: pendingSels, error } = await supabase
    .from('published_bet_selections')
    .select('published_bet_id, sport, team_home, team_away, prediction, result, match_start_at')
    .in('result', ['pending', 'void'])
    .lt('match_start_at', cutoffIso);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!pendingSels || pendingSels.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: 'Rien à rappeler' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Filtre : on garde seulement les sélections qui appartiennent à un bet
  // toujours en pending OU void (= pas déjà résolu par Julien).
  // Sinon on spam pour rien.
  const betIds = Array.from(new Set(pendingSels.map((s) => s.published_bet_id)));
  const { data: bets } = await supabase
    .from('published_bets')
    .select('id, result, kind')
    .in('id', betIds)
    .in('result', ['pending', 'void']);

  if (!bets || bets.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: 'Rien à rappeler' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const pendingBetIds = new Set(bets.map((b) => b.id));
  const relevantSels = pendingSels.filter((s) =>
    pendingBetIds.has(s.published_bet_id),
  );

  // Compteurs par catégorie
  const tennisCount = relevantSels.filter((s) => s.sport === 'tennis').length;
  const footCount = relevantSels.filter((s) => s.sport === 'foot').length;
  const totalBets = pendingBetIds.size;

  // 2) Récupère les admins/validators avec un push token
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, expo_push_token, role')
    .in('role', ['admin', 'validator'])
    .not('expo_push_token', 'is', null);

  if (!staff || staff.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, sent: 0, message: 'Aucun admin avec push token' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 3) Construit le message
  const parts: string[] = [];
  if (footCount > 0) parts.push(`${footCount} foot`);
  if (tennisCount > 0) parts.push(`${tennisCount} tennis`);
  const detail = parts.join(' + ');

  const title = `⏰ ${totalBets} pari${totalBets > 1 ? 's' : ''} à valider`;
  const body = `${detail} en attente de résultat manuel. Tap pour ouvrir l'admin.`;

  // 4) Envoie aux push tokens
  const messages = staff
    .filter((s): s is { id: string; expo_push_token: string; role: string } =>
      typeof s.expo_push_token === 'string',
    )
    .map((s) => ({
      to: s.expo_push_token,
      title,
      body,
      sound: 'default',
      data: {
        type: 'admin_pending_reminder',
        count: totalBets,
        foot_count: footCount,
        tennis_count: tennisCount,
        // Tap → route vers l'admin
        url: '/(app)/admin',
      },
    }));

  let sentCount = 0;
  const errors: string[] = [];
  for (let i = 0; i < messages.length; i += 100) {
    const chunk = messages.slice(i, i + 100);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(chunk),
      });
      if (!res.ok) {
        errors.push(`HTTP ${res.status}`);
      } else {
        sentCount += chunk.length;
      }
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'fetch failed');
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      sent: sentCount,
      pending_bets: totalBets,
      foot_selections: footCount,
      tennis_selections: tennisCount,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
