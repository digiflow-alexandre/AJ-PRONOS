import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import type { VipMessage, VipMessageRead } from '@/types/vip-message';

type UseVipReadsResult = {
  reads: VipMessageRead[];
  /** Marque le dernier message visible comme "lu" par l'utilisateur courant. */
  markRead: (lastMessageId: string) => Promise<void>;
  /** Pour un message envoyé par moi, combien d'AUTRES users l'ont lu ?
   *  (= leur last_read_message_id est plus récent que celui-ci). */
  getReadCount: (message: VipMessage, allMessages: VipMessage[]) => number;
};

export function useVipReads(): UseVipReadsResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [reads, setReads] = useState<VipMessageRead[]>([]);

  const fetchReads = useCallback(async () => {
    const { data } = await supabase.from('vip_message_reads').select('*');
    setReads((data ?? []) as VipMessageRead[]);
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReads([]);
      return;
    }
    fetchReads();

    const channelName = `vip_reads:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vip_message_reads' },
        () => fetchReads(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchReads]);

  const markRead = useCallback(
    async (lastMessageId: string) => {
      if (!userId) return;
      const myRead = reads.find((r) => r.user_id === userId);
      // Skip si on a déjà marqué ce message (ou plus récent)
      if (myRead?.last_read_message_id === lastMessageId) return;
      // Upsert (insert ou update si existe déjà)
      await supabase.from('vip_message_reads').upsert(
        {
          user_id: userId,
          last_read_message_id: lastMessageId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    },
    [userId, reads],
  );

  /** Map message_id → index dans allMessages (pour comparer ancienneté). */
  const messageIndexById = useMemo(() => null, []); // computed in getReadCount

  const getReadCount = useCallback(
    (message: VipMessage, allMessages: VipMessage[]) => {
      if (!userId) return 0;
      const messageIdx = allMessages.findIndex((m) => m.id === message.id);
      if (messageIdx < 0) return 0;
      // Count d'autres users dont last_read_message_id est >= message.id
      // (= position dans la liste >= messageIdx)
      let count = 0;
      for (const r of reads) {
        if (r.user_id === userId) continue; // soi-même
        const idx = allMessages.findIndex((m) => m.id === r.last_read_message_id);
        if (idx >= messageIdx) count++;
      }
      return count;
    },
    [userId, reads],
  );

  // Force la dépendance pour éviter unused warning
  void messageIndexById;

  return { reads, markRead, getReadCount };
}
