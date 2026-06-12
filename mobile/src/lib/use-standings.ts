import { useEffect, useState } from 'react';

import { FOOT_COMPETITIONS } from '@/constants/competitions';
import { supabase } from './supabase';
import type { StandingRow } from '@/types/stats';

type StandingRowDb = {
  team_name: string;
  team_logo: string | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  standing_rank: number | null;
  standing_points: number | null;
  standing_group: string | null;
};

/**
 * Récupère le classement live d'une compétition depuis la table team_stats
 * (alimentée par l'Edge Function `refresh-team-stats` toutes les 6h).
 *
 * Accepte un label de compétition (ex "Ligue 1", "Ligue 1 · J32", "La Liga")
 * et fait le mapping vers `api_league_id` via la table COMPETITIONS.
 *
 * Retourne `null` tant que le fetch n'est pas terminé, `[]` si pas de data.
 * Le composant peut ainsi fallback sur des stats mockées en attendant.
 */
export function useStandings(competitionLabel: string | undefined): {
  standings: StandingRow[] | null;
  isLoading: boolean;
} {
  const [standings, setStandings] = useState<StandingRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!competitionLabel) {
      setStandings(null);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      setIsLoading(true);
      // Extrait juste le label ("Ligue 1 · J32" → "Ligue 1")
      const baseLabel = competitionLabel.split('·')[0].trim();
      const comp = FOOT_COMPETITIONS.find(
        (c) => c.label.toLowerCase() === baseLabel.toLowerCase(),
      );
      if (!comp?.apiLeagueId) {
        setStandings([]);
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('team_stats')
        .select(
          'team_name, team_logo, played, wins, draws, losses, goals_for, goals_against, standing_rank, standing_points, standing_group',
        )
        .eq('api_league_id', comp.apiLeagueId)
        .order('standing_group', { ascending: true, nullsFirst: true })
        .order('standing_rank', { ascending: true });
      if (ac.signal.aborted) return;
      if (error || !data) {
        setStandings([]);
        setIsLoading(false);
        return;
      }
      const rows: StandingRow[] = (data as StandingRowDb[])
        .filter((r) => r.standing_rank != null)
        .map((r) => ({
          position: r.standing_rank!,
          team: r.team_name,
          teamLogo: r.team_logo ?? undefined,
          played: r.played ?? 0,
          wins: r.wins ?? 0,
          draws: r.draws ?? 0,
          losses: r.losses ?? 0,
          goalsFor: r.goals_for ?? 0,
          goalsAgainst: r.goals_against ?? 0,
          goalDiff: (r.goals_for ?? 0) - (r.goals_against ?? 0),
          points: r.standing_points ?? 0,
          group: r.standing_group,
        }));
      setStandings(rows);
      setIsLoading(false);
    })();
    return () => {
      ac.abort();
    };
  }, [competitionLabel]);

  return { standings, isLoading };
}
