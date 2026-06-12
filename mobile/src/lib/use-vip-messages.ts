import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-context';
import { useProfile } from './use-profile';
import { supabase } from './supabase';
import type { ReplyToSnapshot, VipMessage } from '@/types/vip-message';

export type SendMessageOpts = {
  /** ID du message qu'on cite (reply WhatsApp-style). */
  replyToId?: string;
  /** Snapshot du message cité (sender_display_name + content). */
  replyToSnapshot?: ReplyToSnapshot;
  /** IDs des users mentionnés dans le content via @pseudo. */
  mentionedUserIds?: string[];
};

type UseVipMessagesResult = {
  messages: VipMessage[];
  isLoading: boolean;
  error: string | null;
  /** L'utilisateur courant peut-il accéder au salon (VIP ou staff) ? */
  hasAccess: boolean;
  /** Envoie un message dans le salon (avec reply et mentions optionnels). */
  sendMessage: (
    content: string,
    opts?: SendMessageOpts,
  ) => Promise<{ error: string | null }>;
  /** Soft-delete un message (admin/validator uniquement). */
  deleteMessage: (id: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

const MAX_MESSAGES_LOADED = 200;

export function useVipMessages(): UseVipMessagesResult {
  const { session } = useAuth();
  const { profile, isTrialActive, isStaff } = useProfile();
  const userId = session?.user.id;

  const hasAccess =
    isStaff || (profile?.tier === 'vip' && (isTrialActive || !profile.trial_ends_at));

  const [messages, setMessages] = useState<VipMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(
    async (signal?: AbortSignal) => {
      if (!hasAccess) {
        setMessages([]);
        setIsLoading(false);
        return;
      }
      const { data, error: err } = await supabase
        .from('vip_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES_LOADED);
      if (signal?.aborted) return;
      if (err) {
        setError(err.message);
        setMessages([]);
      } else {
        setError(null);
        // On stocke en ordre chronologique ascendant (récent en bas) pour l'affichage
        setMessages(((data ?? []) as VipMessage[]).reverse());
      }
      setIsLoading(false);
    },
    [hasAccess],
  );

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages([]);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    fetchMessages(ac.signal);

    // Realtime : push live des nouveaux messages
    const channelName = `vip_messages:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_messages' },
        () => fetchMessages(),
      )
      .subscribe();

    return () => {
      ac.abort();
      supabase.removeChannel(channel);
    };
  }, [userId, fetchMessages]);

  const sendMessage = useCallback(
    async (content: string, opts?: SendMessageOpts) => {
      if (!userId) return { error: 'Pas de session.' };
      if (!hasAccess) return { error: 'Pas d’accès au salon VIP.' };
      const trimmed = content.trim();
      if (!trimmed) return { error: 'Message vide.' };
      const { error: err } = await supabase.from('vip_messages').insert({
        sender_id: userId,
        sender_display_name: profile?.display_name ?? null,
        sender_role: profile?.role ?? 'user',
        content: trimmed,
        message_type: 'text',
        reply_to_message_id: opts?.replyToId ?? null,
        reply_to_snapshot: opts?.replyToSnapshot ?? null,
        mentioned_user_ids: opts?.mentionedUserIds ?? [],
      });
      if (err) return { error: err.message };
      await fetchMessages();
      return { error: null };
    },
    [userId, hasAccess, profile?.display_name, profile?.role, fetchMessages],
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      if (!userId) return { error: 'Pas de session.' };
      if (!isStaff) return { error: 'Réservé aux admins.' };
      const { error: err } = await supabase
        .from('vip_messages')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: userId,
        })
        .eq('id', id);
      if (err) return { error: err.message };
      return { error: null };
    },
    [userId, isStaff],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchMessages();
  }, [fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    hasAccess,
    sendMessage,
    deleteMessage,
    refresh,
  };
}
