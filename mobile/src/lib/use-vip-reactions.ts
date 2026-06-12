import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import type { VipReaction } from '@/types/vip-message';

export type ReactionGroup = {
  emoji: string;
  count: number;
  /** Vrai si l'utilisateur courant a réagi avec cet emoji. */
  hasMine: boolean;
  /** Liste des user_ids qui ont réagi (pour tooltip future). */
  userIds: string[];
};

type UseVipReactionsResult = {
  /** Map: message_id → liste de groupes (emoji + count + userIds). */
  reactionsByMessage: Map<string, ReactionGroup[]>;
  isLoading: boolean;
  toggleReaction: (
    messageId: string,
    emoji: string,
  ) => Promise<{ error: string | null }>;
};

export function useVipReactions(): UseVipReactionsResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [reactions, setReactions] = useState<VipReaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReactions = useCallback(async () => {
    const { data } = await supabase.from('vip_message_reactions').select('*');
    setReactions((data ?? []) as VipReaction[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReactions([]);
      setIsLoading(false);
      return;
    }
    fetchReactions();

    const channelName = `vip_reactions:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_message_reactions' },
        () => fetchReactions(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReactions]);

  /** Agrégation par message_id + emoji avec counts. */
  const reactionsByMessage = useMemo(() => {
    const map = new Map<string, Map<string, ReactionGroup>>();
    for (const r of reactions) {
      let byEmoji = map.get(r.message_id);
      if (!byEmoji) {
        byEmoji = new Map();
        map.set(r.message_id, byEmoji);
      }
      let group = byEmoji.get(r.emoji);
      if (!group) {
        group = { emoji: r.emoji, count: 0, hasMine: false, userIds: [] };
        byEmoji.set(r.emoji, group);
      }
      group.count++;
      group.userIds.push(r.user_id);
      if (r.user_id === userId) group.hasMine = true;
    }
    const result = new Map<string, ReactionGroup[]>();
    for (const [msgId, byEmoji] of map) {
      result.set(
        msgId,
        Array.from(byEmoji.values()).sort((a, b) => b.count - a.count),
      );
    }
    return result;
  }, [reactions, userId]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!userId) return { error: 'Pas de session.' };
      // Si déjà réagi avec cet emoji → on supprime, sinon on ajoute
      const groups = reactionsByMessage.get(messageId) ?? [];
      const existing = groups.find((g) => g.emoji === emoji);
      if (existing?.hasMine) {
        const { error: err } = await supabase
          .from('vip_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', userId)
          .eq('emoji', emoji);
        if (err) return { error: err.message };
      } else {
        const { error: err } = await supabase
          .from('vip_message_reactions')
          .insert({
            message_id: messageId,
            user_id: userId,
            emoji,
          });
        if (err) return { error: err.message };
      }
      await fetchReactions();
      return { error: null };
    },
    [userId, reactionsByMessage, fetchReactions],
  );

  return { reactionsByMessage, isLoading, toggleReaction };
}
