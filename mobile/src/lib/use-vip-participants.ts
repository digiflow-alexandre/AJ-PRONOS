import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import type { VipParticipant } from '@/types/vip-message';

/**
 * Hook qui charge la liste des participants au salon VIP (VIP actifs + staff
 * avec un display_name). Sert principalement à l'autocomplete des mentions
 * @pseudo dans l'input du chat.
 */
export function useVipParticipants(): {
  participants: VipParticipant[];
  isLoading: boolean;
} {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [participants, setParticipants] = useState<VipParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    const { data } = await supabase.rpc('list_vip_participants');
    setParticipants((data ?? []) as VipParticipant[]);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setParticipants([]);
      setIsLoading(false);
      return;
    }
    fetchParticipants();
  }, [userId, fetchParticipants]);

  return { participants, isLoading };
}
