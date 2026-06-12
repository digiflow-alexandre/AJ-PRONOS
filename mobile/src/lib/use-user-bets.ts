import { useCallback, useEffect, useState } from 'react';

import type { AnyBet } from '@/types/prono';
import { getBetStartDate } from '@/types/prono';
import type { UserBet, UserBetSnapshot } from '@/types/user-bet';

import { useAuth } from './auth-context';
import { supabase } from './supabase';

export type PersonalRoi = {
  /** Nombre de paris joués (toutes périodes). */
  totalPlayed: number;
  /** Paris joués déjà résolus (win/loss/void). */
  totalResolved: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  /** % de réussite sur les résolus. */
  winRate: number;
  /** Somme des mises (en €) sur les paris résolus. 0 si aucune mise saisie. */
  totalStaked: number;
  /** Somme des gains nets (en €) sur les paris résolus. Négatif si perte. */
  netGain: number;
  /** ROI réel en % (netGain / totalStaked × 100). 0 si totalStaked = 0. */
  realRoi: number;
};

type UseUserBetsResult = {
  userBets: UserBet[];
  isLoading: boolean;
  error: string | null;
  /** Set des bet_ids déjà marqués comme joués (pour quick lookup UI). */
  playedBetIds: Set<string>;
  /** Bilan ROI réel sur les paris joués. */
  personalRoi: PersonalRoi;
  markAsPlayed: (
    bet: AnyBet,
    stake?: number,
    notes?: string,
    /** Cote bookmaker au moment où le user a joué (peut différer de notre
     *  cote publiée). Si fournie, override la cote du snapshot. */
    customOdd?: number,
  ) => Promise<{ error: string | null }>;
  unmarkBet: (betId: string) => Promise<{ error: string | null }>;
  refresh: () => Promise<void>;
};

function buildSnapshot(bet: AnyBet): UserBetSnapshot {
  if (bet.type === 'single') {
    return {
      title: `${bet.teamHome} - ${bet.teamAway}`,
      sport: bet.sport,
      competition: bet.competition,
      odd: bet.odd,
      result: bet.result,
      matchStartAt: bet.matchStartAt,
    };
  }
  // Combo : sport agrégé pour le choix du bg de card
  const sportSet = new Set(bet.selections.map((s) => s.sport));
  const sport: 'foot' | 'tennis' | 'mixed' =
    sportSet.size === 1 && sportSet.has('foot')
      ? 'foot'
      : sportSet.size === 1 && sportSet.has('tennis')
        ? 'tennis'
        : 'mixed';
  return {
    title: `Combiné ${bet.selections.length} sélections`,
    sport,
    competition: bet.selections
      .map((s) => s.competition.split(' · ')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .join(' · '),
    odd: bet.combinationOdd,
    result: bet.result,
    matchStartAt: getBetStartDate(bet),
  };
}

function computePersonalRoi(userBets: UserBet[]): PersonalRoi {
  let wins = 0;
  let losses = 0;
  let voids = 0;
  let pending = 0;
  let totalStaked = 0;
  let netGain = 0;

  for (const ub of userBets) {
    const result = ub.bet_snapshot.result;
    if (result === 'pending' || result === 'live') {
      pending++;
      continue;
    }
    if (result === 'win') wins++;
    else if (result === 'loss') losses++;
    else if (result === 'void') voids++;

    if (ub.stake != null) {
      // Les paris void rendent la mise → pas d'impact net
      if (result === 'win') {
        totalStaked += ub.stake;
        netGain += ub.stake * (ub.bet_snapshot.odd - 1);
      } else if (result === 'loss') {
        totalStaked += ub.stake;
        netGain -= ub.stake;
      }
      // void : on n'ajoute pas à totalStaked car la mise est rendue
    }
  }

  const totalResolved = wins + losses + voids;
  return {
    totalPlayed: userBets.length,
    totalResolved,
    wins,
    losses,
    voids,
    pending,
    winRate: totalResolved > 0 ? Math.round((wins / totalResolved) * 100) : 0,
    totalStaked: Math.round(totalStaked * 100) / 100,
    netGain: Math.round(netGain * 100) / 100,
    realRoi:
      totalStaked > 0 ? Math.round((netGain / totalStaked) * 100) : 0,
  };
}

export function useUserBets(): UseUserBetsResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserBets = useCallback(
    async (uid: string, signal?: AbortSignal) => {
      const { data, error: err } = await supabase
        .from('user_bets')
        .select('*')
        .eq('user_id', uid)
        .order('played_at', { ascending: false });
      if (signal?.aborted) return;
      if (err) {
        setError(err.message);
        setUserBets([]);
      } else {
        setError(null);
        setUserBets((data ?? []) as UserBet[]);
      }
      setIsLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserBets([]);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    fetchUserBets(userId, ac.signal);

    const channelName = `user_bets:${userId}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_bets',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Re-fetch complet (plus simple que de patcher la liste)
          fetchUserBets(userId);
        },
      )
      .subscribe();

    return () => {
      ac.abort();
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUserBets]);

  const markAsPlayed = useCallback(
    async (
      bet: AnyBet,
      stake?: number,
      notes?: string,
      customOdd?: number,
    ) => {
      if (!userId) return { error: 'Pas de session.' };
      // Snapshot avec override de cote si l'user a saisi une cote bookmaker
      // différente (au moment du jeu, la cote chez son bookmaker peut avoir
      // bougé vs notre cote publiée).
      const snapshot = buildSnapshot(bet);
      const finalSnapshot =
        customOdd != null ? { ...snapshot, odd: customOdd } : snapshot;
      const { error: err } = await supabase.from('user_bets').insert({
        user_id: userId,
        bet_id: bet.id,
        bet_type: bet.type,
        bet_snapshot: finalSnapshot,
        stake: stake ?? null,
        notes: notes ?? null,
      });
      if (err) return { error: err.message };
      // Refetch immédiat pour que l'instance qui appelle voie le nouveau
      // pari sans attendre l'event Realtime (qui n'est pas garanti si la
      // table n'est pas dans la publication realtime).
      await fetchUserBets(userId);
      return { error: null };
    },
    [userId, fetchUserBets],
  );

  const unmarkBet = useCallback(
    async (betId: string) => {
      if (!userId) return { error: 'Pas de session.' };
      const { error: err } = await supabase
        .from('user_bets')
        .delete()
        .eq('user_id', userId)
        .eq('bet_id', betId);
      if (err) return { error: err.message };
      return { error: null };
    },
    [userId],
  );

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    await fetchUserBets(userId);
  }, [userId, fetchUserBets]);

  const playedBetIds = new Set(userBets.map((ub) => ub.bet_id));
  const personalRoi = computePersonalRoi(userBets);

  return {
    userBets,
    isLoading,
    error,
    playedBetIds,
    personalRoi,
    markAsPlayed,
    unmarkBet,
    refresh,
  };
}
