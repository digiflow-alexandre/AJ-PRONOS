/**
 * useNotificationsFeed — Construit dynamiquement le feed de notifications
 * de l'utilisateur en agrégeant les events des tables existantes.
 *
 * Pas de table "notifications" dédiée pour le V1 — on lit live depuis :
 *  - published_bets (nouveaux pronos publiés, paris résolus)
 *  - vip_messages (messages salon VIP, si tier=vip ou staff)
 *
 * Filtré par pack du user : un Starter ne voit pas les nouveaux pronos
 * réservés Pro ou VIP, etc.
 */

import { useCallback, useEffect, useState } from 'react';

import { useProfile } from './use-profile';
import { supabase } from './supabase';

export type NotifType =
  | 'new_prono'      // 🔥 Nouveau prono publié (accessible à mon tier)
  | 'bet_won'        // 🏆 Un de mes pronos a gagné
  | 'bet_lost'       // ❌ Un de mes pronos a perdu
  | 'vip_message'    // 💎 Message dans le salon VIP
  | 'carnet_reminder'; // 📒 Rappel mise à jour carnet (à venir, on ne stocke pas pour l'instant)

export type NotificationItem = {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  /** ISO timestamp (utilisé pour tri + label relatif) */
  createdAt: string;
  /** Route à pousser au tap (ex: '/bet/abc123', '/(app)/vip') */
  target?: string;
  /** Données contextuelles éventuelles (id du pari, etc.) */
  data?: Record<string, unknown>;
};

const TIER_RANK: Record<'starter' | 'pro' | 'vip' | 'trial', number> = {
  trial: 1,
  starter: 1,
  pro: 2,
  vip: 3,
};

const WINDOW_DAYS = 7;

type UseNotificationsFeedResult = {
  items: NotificationItem[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useNotificationsFeed(): UseNotificationsFeedResult {
  const { profile, isStaff } = useProfile();
  const tier = profile?.tier ?? 'starter';
  const userRank = TIER_RANK[tier];
  const canSeeVipMessages = tier === 'vip' || isStaff;

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    const since = new Date(
      Date.now() - WINDOW_DAYS * 24 * 3600 * 1000,
    ).toISOString();

    // 1) Pronos publiés récemment (filtrés par tier)
    const pronosRes = await supabase
      .from('published_bets')
      .select(
        'id, kind, min_tier, result, total_odd, published_at, updated_at, ' +
          'published_bet_selections(team_home, team_away, prediction, final_score)',
      )
      .gte('published_at', since)
      .order('published_at', { ascending: false })
      .limit(50);

    // 2) Messages VIP récents (si tier=vip ou staff)
    const vipRes = canSeeVipMessages
      ? await supabase
          .from('vip_messages')
          .select('id, sender_display_name, sender_role, content, created_at, message_type, deleted_at')
          .gte('created_at', since)
          .is('deleted_at', null)
          .eq('message_type', 'text')
          .order('created_at', { ascending: false })
          .limit(30)
      : { data: [] as VipMessageRow[] };

    const pronosData = (pronosRes.data ?? []) as unknown as PublishedBetRow[];
    const vipData = (vipRes.data ?? []) as unknown as VipMessageRow[];

    const list: NotificationItem[] = [];

    // === Pronos ===
    for (const p of pronosData) {
      const tierRank = TIER_RANK[p.min_tier as keyof typeof TIER_RANK];
      // L'utilisateur doit avoir un tier ≥ au tier requis du pari
      if (tierRank > userRank && !isStaff) continue;

      const sels = p.published_bet_selections ?? [];
      const isCombo = p.kind === 'combo';
      const summary = isCombo
        ? `Combiné ${sels.length} sélections @ ${p.total_odd}`
        : sels[0]
          ? `${sels[0].team_home} vs ${sels[0].team_away} @ ${p.total_odd}`
          : `Prono @ ${p.total_odd}`;

      // 1) Notification "nouveau prono" (basée sur published_at)
      list.push({
        id: `new-${p.id}`,
        type: 'new_prono',
        title:
          p.min_tier === 'vip'
            ? '💎 Nouveau prono VIP'
            : p.min_tier === 'pro'
              ? '🔥 Nouveau prono Pro'
              : '🔥 Nouveau prono',
        body: summary,
        createdAt: p.published_at,
        target: `/bet/${p.id}`,
        data: { betId: p.id },
      });

      // 2) Si le pari est résolu (win/loss), on ajoute une 2e notif basée
      //    sur updated_at (= moment où l'admin/tracker a marqué le résultat)
      if (
        (p.result === 'win' || p.result === 'loss') &&
        p.updated_at &&
        p.updated_at > since
      ) {
        const finalScore = sels[0]?.final_score ?? null;
        list.push({
          id: `${p.result}-${p.id}`,
          type: p.result === 'win' ? 'bet_won' : 'bet_lost',
          title: p.result === 'win' ? '🏆 Pari gagné' : '❌ Pari perdu',
          body: isCombo
            ? `Combiné ${sels.length} sélections — cote x${p.total_odd}${finalScore ? '' : ''}`
            : `${sels[0]?.team_home} vs ${sels[0]?.team_away}${finalScore ? ` — ${finalScore}` : ''}`,
          createdAt: p.updated_at,
          target: `/bet/${p.id}`,
          data: { betId: p.id },
        });
      }
    }

    // === Messages VIP ===
    for (const m of vipData) {
      const sender = m.sender_display_name?.trim() || 'Un membre';
      const isStaffMsg =
        m.sender_role === 'admin' || m.sender_role === 'validator';
      const preview = m.content.length > 90 ? m.content.slice(0, 87) + '…' : m.content;
      list.push({
        id: `vip-${m.id}`,
        type: 'vip_message',
        title: `${isStaffMsg ? '💎' : '💬'} ${sender} · Salon VIP`,
        body: preview,
        createdAt: m.created_at,
        target: '/(app)/vip',
        data: { messageId: m.id },
      });
    }

    // Tri global par date DESC
    list.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    setItems(list);
    setIsLoading(false);
  }, [userRank, canSeeVipMessages, isStaff]);

  useEffect(() => {
    if (!profile) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    fetchFeed();
  }, [profile, fetchFeed]);

  return { items, isLoading, refresh: fetchFeed };
}

// ============================================================
// Types DB (allégés)
// ============================================================

type PublishedBetRow = {
  id: string;
  kind: 'single' | 'combo';
  min_tier: 'starter' | 'pro' | 'vip';
  result: 'pending' | 'live' | 'win' | 'loss' | 'void';
  total_odd: number;
  published_at: string;
  updated_at: string | null;
  published_bet_selections: Array<{
    team_home: string;
    team_away: string;
    prediction: string;
    final_score: string | null;
  }>;
};

type VipMessageRow = {
  id: string;
  sender_display_name: string | null;
  sender_role: string;
  content: string;
  created_at: string;
  message_type: string;
  deleted_at: string | null;
};
