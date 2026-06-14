// AJ Pronos — Edge Function : notify-vip-message
//
// Appelée par le trigger Postgres `vip_messages_notify_push` après chaque
// insert dans `vip_messages`. Compose un push notif et le diffuse via
// `send-push-notification` à tous les VIPs (+ admin/validator) qui ont
// opt-in pour `vip_new_messages`, en excluant l'envoyeur lui-même.
//
// Body attendu (envoyé par le trigger pg_net) :
//   { "message_id": "<uuid>" }
//
// Déploiement :
//   supabase functions deploy notify-vip-message --no-verify-jwt
//   (pas de verify JWT car appelé par Postgres avec le service role)

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let payload: { message_id?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const messageId = payload.message_id;
  if (!messageId) {
    return new Response('Missing message_id', { status: 400 });
  }

  // Récupère le message
  const { data: message, error: msgErr } = await supabase
    .from('vip_messages')
    .select('id, sender_id, sender_display_name, sender_role, content, deleted_at, message_type')
    .eq('id', messageId)
    .single();

  if (msgErr || !message) {
    return new Response(
      JSON.stringify({ ok: false, error: msgErr?.message ?? 'not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Skip si le message a été soft-deleted ou si c'est un message système
  // (ex : "X a rejoint le salon")
  if (message.deleted_at || message.message_type !== 'text') {
    return new Response(
      JSON.stringify({ ok: true, skipped: 'deleted or system' }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Compose le push
  const senderName = message.sender_display_name?.trim() || 'Un membre';
  // Les messages de Julien (validator) et Alex (admin) ont un préfixe 💎
  // pour distinguer le coaching staff des autres VIPs.
  const isStaff = message.sender_role === 'admin' || message.sender_role === 'validator';
  const emoji = isStaff ? '💎 ' : '💬 ';
  const title = `${emoji}${senderName} dans le salon VIP`;
  // Tronque à ~140 chars (limite Expo recommandée pour body)
  const raw = message.content.trim();
  const truncated = raw.length > 140 ? raw.slice(0, 137) + '…' : raw;
  const body = `« ${truncated} »`;

  // Appel send-push-notification
  const pushRes = await fetch(
    `${supabaseUrl}/functions/v1/send-push-notification`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        title,
        body,
        data: { type: 'vip_message', message_id: message.id },
        filter: {
          min_tier: 'vip',
          pref_field: 'vip_new_messages',
          exclude_user_ids: message.sender_id ? [message.sender_id] : [],
        },
      }),
    },
  );
  const pushResult = await pushRes.json().catch(() => ({}));

  return new Response(
    JSON.stringify({ ok: true, push: pushResult }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
