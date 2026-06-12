import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import type { MatchRow } from '@/types/match';

type UseUpcomingMatchesOptions = {
  /** Filtre par competition_id (slug). undefined = toutes. */
  competitionId?: string;
  /** Max nombre de matchs ramenés. Défaut 100. */
  limit?: number;
};

type UseUpcomingMatchesResult = {
  matches: MatchRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Récupère les matchs à venir (status='scheduled' + date >= maintenant)
 * depuis le cache DB peuplé par l'Edge Function fetch-matches.
 *
 * Utilisé par le MatchPicker de l'admin app pour permettre à Julien
 * de sélectionner un match au lieu de saisir manuellement.
 */
export function useUpcomingMatches(
  opts: UseUpcomingMatchesOptions = {},
): UseUpcomingMatchesResult {
  const { competitionId, limit = 100 } = opts;
  const { session } = useAuth();
  const userId = session?.user.id;

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!userId) return;
    let query = supabase
      .from('matches')
      .select('*')
      .gte('match_start_at', new Date().toISOString())
      .in('status', ['scheduled', 'live'])
      .order('match_start_at', { ascending: true })
      .limit(limit);

    if (competitionId) {
      query = query.eq('competition_id', competitionId);
    }

    const { data, error: err } = await query;
    if (err) {
      setError(err.message);
      setMatches([]);
    } else {
      setError(null);
      setMatches((data ?? []) as MatchRow[]);
    }
    setIsLoading(false);
  }, [userId, competitionId, limit]);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMatches([]);
      setIsLoading(false);
      return;
    }
    fetchMatches();
  }, [userId, fetchMatches]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchMatches();
  }, [fetchMatches]);

  return { matches, isLoading, error, refresh };
}
