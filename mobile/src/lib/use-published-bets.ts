import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth-context';
import { supabase } from './supabase';
import { getCompetitorLogo } from './team-logos';
import type { AnyBet } from '@/types/prono';
import type { SubscriptionTier } from '@/types/profile';
import {
  convertToAnyBet,
  type PublishedBetRow,
  type PublishedBetSelectionRow,
} from '@/types/published-bet';

export type NewSingleBetInput = {
  minTier: Exclude<SubscriptionTier, 'trial'>;
  confidence: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  bookmakerName?: string;
  bookmakerScreenshotUrl?: string;
  /** ID API-Football du match (si sélectionné depuis MatchPicker) — pour
   *  permettre l'auto-tracking des résultats via Edge Function. */
  matchApiFixtureId?: number;
  selection: {
    sport: 'foot' | 'tennis';
    competition: string;
    teamHome: string;
    teamAway: string;
    matchStartAt: string;
    prediction: string;
    odd: number;
  };
};

export type NewComboBetInput = {
  minTier: Exclude<SubscriptionTier, 'trial'>;
  confidence: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  bookmakerName?: string;
  bookmakerScreenshotUrl?: string;
  selections: {
    sport: 'foot' | 'tennis';
    competition: string;
    teamHome: string;
    teamAway: string;
    matchStartAt: string;
    prediction: string;
    odd: number;
    miniReasoning?: string;
    /** ID API-Football du match (si sélectionné depuis MatchPicker) — pour
     *  permettre l'auto-tracking via track-results. Null si saisie manuelle
     *  ou tennis (pas d'API). */
    matchApiFixtureId?: number;
  }[];
};

type UsePublishedBetsResult = {
  bets: AnyBet[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  publishSingle: (
    input: NewSingleBetInput,
  ) => Promise<{ id: string | null; error: string | null }>;
  publishCombo: (
    input: NewComboBetInput,
  ) => Promise<{ id: string | null; error: string | null }>;
  deleteBet: (id: string) => Promise<{ error: string | null }>;
  /** Marque un pari comme gagné / perdu / annulé / en attente. Update aussi
   *  toutes les sélections du combo avec le même résultat (pour V1 simple).
   *  finalScore optionnel : si fourni, est appliqué à toutes les sélections. */
  updateResult: (
    id: string,
    result: 'win' | 'loss' | 'void' | 'pending',
    finalScore?: string,
  ) => Promise<{ error: string | null }>;
};

export function usePublishedBets(): UsePublishedBetsResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [bets, setBets] = useState<AnyBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBets = useCallback(async (signal?: AbortSignal) => {
    // 1) Récupère tous les bets publiés (descending)
    const { data: betsData, error: betsErr } = await supabase
      .from('published_bets')
      .select('*')
      .order('published_at', { ascending: false });
    if (signal?.aborted) return;
    if (betsErr) {
      setError(betsErr.message);
      setBets([]);
      setIsLoading(false);
      return;
    }
    const betRows = (betsData ?? []) as PublishedBetRow[];
    if (betRows.length === 0) {
      setError(null);
      setBets([]);
      setIsLoading(false);
      return;
    }
    // 2) Récupère toutes les sélections en une requête
    const ids = betRows.map((b) => b.id);
    const { data: selsData, error: selsErr } = await supabase
      .from('published_bet_selections')
      .select('*')
      .in('published_bet_id', ids);
    if (signal?.aborted) return;
    if (selsErr) {
      setError(selsErr.message);
      setBets([]);
      setIsLoading(false);
      return;
    }
    const selectionsByBet = new Map<string, PublishedBetSelectionRow[]>();
    for (const s of (selsData ?? []) as PublishedBetSelectionRow[]) {
      const list = selectionsByBet.get(s.published_bet_id) ?? [];
      list.push(s);
      selectionsByBet.set(s.published_bet_id, list);
    }
    // 3) Convertit en AnyBet et stocke
    const converted: AnyBet[] = betRows
      .map((b) => {
        const sels = selectionsByBet.get(b.id) ?? [];
        try {
          return convertToAnyBet(b, sels);
        } catch {
          return null;
        }
      })
      .filter((b): b is AnyBet => b !== null);
    setError(null);
    setBets(converted);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setBets([]);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    fetchBets(ac.signal);

    // Realtime : re-fetch quand y'a un changement sur les pronos publiés
    const channelName = `published_bets:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'published_bets' },
        () => fetchBets(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'published_bet_selections' },
        () => fetchBets(),
      )
      .subscribe();

    return () => {
      ac.abort();
      supabase.removeChannel(channel);
    };
  }, [userId, fetchBets]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchBets();
  }, [fetchBets]);

  const publishSingle = useCallback(
    async (
      input: NewSingleBetInput,
    ): Promise<{ id: string | null; error: string | null }> => {
      if (!userId) return { id: null, error: 'Pas de session.' };
      // 1) Insert published_bets
      const { data: betData, error: betErr } = await supabase
        .from('published_bets')
        .insert({
          kind: 'single',
          min_tier: input.minTier,
          confidence: input.confidence,
          reasoning: input.reasoning,
          total_odd: input.selection.odd,
          bookmaker_screenshot_url: input.bookmakerScreenshotUrl ?? null,
          bookmaker_name: input.bookmakerName ?? null,
          match_api_fixture_id: input.matchApiFixtureId ?? null,
          published_by: userId,
        })
        .select('id')
        .single();
      if (betErr || !betData) {
        return { id: null, error: betErr?.message ?? 'Insert échoué.' };
      }
      const betId = betData.id as string;
      // 2) Insert la sélection unique (auto-attach les logos via team-logos)
      const { error: selErr } = await supabase
        .from('published_bet_selections')
        .insert({
          published_bet_id: betId,
          position: 0,
          sport: input.selection.sport,
          competition: input.selection.competition,
          team_home: input.selection.teamHome,
          team_away: input.selection.teamAway,
          team_home_logo:
            getCompetitorLogo(input.selection.teamHome, input.selection.sport) ?? null,
          team_away_logo:
            getCompetitorLogo(input.selection.teamAway, input.selection.sport) ?? null,
          match_start_at: input.selection.matchStartAt,
          prediction: input.selection.prediction,
          odd: input.selection.odd,
        });
      if (selErr) {
        // Cleanup : si la sélection plante, on supprime le bet pour
        // pas laisser un bet orphelin sans sélection.
        await supabase.from('published_bets').delete().eq('id', betId);
        return { id: null, error: selErr.message };
      }
      return { id: betId, error: null };
    },
    [userId],
  );

  const publishCombo = useCallback(
    async (
      input: NewComboBetInput,
    ): Promise<{ id: string | null; error: string | null }> => {
      if (!userId) return { id: null, error: 'Pas de session.' };
      if (input.selections.length < 2) {
        return {
          id: null,
          error: 'Un combiné doit contenir au moins 2 sélections.',
        };
      }
      const totalOdd =
        Math.round(
          input.selections.reduce((acc, s) => acc * s.odd, 1) * 100,
        ) / 100;
      // 1) Insert published_bets
      const { data: betData, error: betErr } = await supabase
        .from('published_bets')
        .insert({
          kind: 'combo',
          min_tier: input.minTier,
          confidence: input.confidence,
          reasoning: input.reasoning,
          total_odd: totalOdd,
          bookmaker_screenshot_url: input.bookmakerScreenshotUrl ?? null,
          bookmaker_name: input.bookmakerName ?? null,
          published_by: userId,
        })
        .select('id')
        .single();
      if (betErr || !betData) {
        return { id: null, error: betErr?.message ?? 'Insert échoué.' };
      }
      const betId = betData.id as string;
      // 2) Insert toutes les sélections
      const rows = input.selections.map((s, i) => ({
        published_bet_id: betId,
        position: i,
        sport: s.sport,
        competition: s.competition,
        team_home: s.teamHome,
        team_away: s.teamAway,
        team_home_logo: getCompetitorLogo(s.teamHome, s.sport) ?? null,
        team_away_logo: getCompetitorLogo(s.teamAway, s.sport) ?? null,
        match_start_at: s.matchStartAt,
        prediction: s.prediction,
        odd: s.odd,
        match_api_fixture_id: s.matchApiFixtureId ?? null,
        mini_reasoning: s.miniReasoning ?? '',
      }));
      const { error: selsErr } = await supabase
        .from('published_bet_selections')
        .insert(rows);
      if (selsErr) {
        await supabase.from('published_bets').delete().eq('id', betId);
        return { id: null, error: selsErr.message };
      }
      return { id: betId, error: null };
    },
    [userId],
  );

  const deleteBet = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from('published_bets')
      .delete()
      .eq('id', id);
    if (err) return { error: err.message };
    return { error: null };
  }, []);

  const updateResult = useCallback(
    async (
      id: string,
      result: 'win' | 'loss' | 'void' | 'pending',
      finalScore?: string,
    ) => {
      const nowISO = new Date().toISOString();
      // 1) Update le pari global. On force updated_at = now() pour que le
      //    DailyRecapModal puisse filtrer sur la date de marquage admin.
      const { error: betErr } = await supabase
        .from('published_bets')
        .update({ result, updated_at: nowISO })
        .eq('id', id);
      if (betErr) return { error: betErr.message };
      // 2) Update toutes les sélections du combo avec le même résultat
      //    + finalScore si fourni (sinon on garde l'existant).
      const selUpdate: Record<string, string> = {
        result,
        updated_at: nowISO,
      };
      if (finalScore !== undefined) {
        selUpdate.final_score = finalScore;
      }
      const { error: selErr } = await supabase
        .from('published_bet_selections')
        .update(selUpdate)
        .eq('published_bet_id', id);
      if (selErr) return { error: selErr.message };
      // 3) Refetch local immédiat (les autres instances reçoivent via Realtime)
      await fetchBets();
      return { error: null };
    },
    [fetchBets],
  );

  return {
    bets,
    isLoading,
    error,
    refresh,
    publishSingle,
    publishCombo,
    deleteBet,
    updateResult,
  };
}
