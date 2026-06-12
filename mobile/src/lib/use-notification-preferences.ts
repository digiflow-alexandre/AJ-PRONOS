import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import type { NotificationPreferences } from '@/types/notification';

type UseNotificationPreferencesResult = {
  prefs: NotificationPreferences | null;
  isLoading: boolean;
  /** Update partiel d'une ou plusieurs préférences. */
  update: (
    patch: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>,
  ) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

export function useNotificationPreferences(): UseNotificationPreferencesResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    setPrefs(data as NotificationPreferences | null);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefs(null);
      setIsLoading(false);
      return;
    }
    fetchPrefs();
  }, [userId, fetchPrefs]);

  const update = useCallback(
    async (
      patch: Partial<Omit<NotificationPreferences, 'user_id' | 'updated_at'>>,
    ) => {
      if (!userId) return { error: 'Pas de session.' };
      // Optimistic update
      setPrefs((prev) => (prev ? { ...prev, ...patch } : prev));
      const { error: err } = await supabase
        .from('notification_preferences')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('user_id', userId);
      if (err) {
        // Rollback en cas d'erreur
        await fetchPrefs();
        return { error: err.message };
      }
      return { error: null };
    },
    [userId, fetchPrefs],
  );

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchPrefs();
  }, [fetchPrefs]);

  return { prefs, isLoading, update, refresh };
}
