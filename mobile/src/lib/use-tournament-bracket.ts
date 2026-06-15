// AJ Pronos — Hook : useTournamentBracket
//
// Récupère tous les matchs d'un tournoi tennis et les regroupe par round
// pour afficher l'onglet "Tableau" du Stats Center.
//
// API api-tennis ne fournit pas de bracket structuré — on reconstruit à
// partir de matches.competition_id + matches.round (= tournament_round).
// Les rounds sont triés du plus précoce au plus tardif (Final = dernier).

import { useEffect, useState } from 'react';

import { supabase } from './supabase';

export type BracketMatch = {
  id: string;
  team_home: string;
  team_away: string;
  team_home_logo: string | null;
  team_away_logo: string | null;
  match_start_at: string;
  status: string;
  score_home: number | null;
  score_away: number | null;
  winner_side: 'home' | 'away' | null;
  round: string | null;
  sets_detail: Array<{ score_first: string; score_second: string; score_set: string }> | null;
};

export type BracketRound = {
  /** Label affichable ("Quarter-finals", "1/8 finals", "Final"…) */
  label: string;
  matches: BracketMatch[];
};

// Ordre indicatif des rounds (du + précoce au + tardif).
// On match par sous-chaîne car les labels API varient ("ATP French Open -
// 1/16-finals", "WTA Berlin - Quarter-finals", "Qualification", etc.)
const ROUND_ORDER: Array<{ key: string; label: string }> = [
  { key: 'qualif', label: 'Qualifications' },
  { key: '1/128', label: '1/128 finales' },
  { key: '1/64', label: '1/64 finales' },
  { key: '1/32', label: '1/32 finales' },
  { key: '1/16', label: '1/16 finales' },
  { key: '1/8', label: '1/8 finales' },
  { key: 'quarter', label: 'Quarts de finale' },
  { key: 'semi', label: 'Demi-finales' },
  { key: 'final', label: 'Finale' },
];

function roundIndex(roundLabel: string | null): number {
  if (!roundLabel) return -1;
  const lower = roundLabel.toLowerCase();
  for (let i = 0; i < ROUND_ORDER.length; i++) {
    if (lower.includes(ROUND_ORDER[i].key)) return i;
  }
  return -1;
}

type UseTournamentBracketResult = {
  rounds: BracketRound[];
  isLoading: boolean;
};

export function useTournamentBracket(
  competitionId: string | null | undefined,
  season: number | null | undefined,
): UseTournamentBracketResult {
  const [rounds, setRounds] = useState<BracketRound[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!competitionId) {
        setRounds([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      // Filtre par competition_id + season : l'API api-tennis partage le
      // même tournament_key entre toutes les éditions d'un tournoi (Halle
      // 2024 et Halle 2026 ont le même competition_id). On limite donc à
      // la season du match du prono pour n'avoir que l'édition en cours.
      let query = supabase
        .from('matches')
        .select(
          'id, team_home, team_away, team_home_logo, team_away_logo, match_start_at, status, score_home, score_away, winner_side, round, sets_detail',
        )
        .eq('sport', 'tennis')
        .eq('competition_id', competitionId)
        // Exclut les matchs doubles (même tournament_key que les singles).
        .not('team_home', 'ilike', '%/%')
        .not('team_away', 'ilike', '%/%');
      if (season != null) {
        query = query.eq('season', season);
      }
      const { data } = await query.order('match_start_at', { ascending: true });

      if (cancelled) return;

      const matches = (data ?? []) as BracketMatch[];

      // Groupage par round (avec ordre)
      const byRoundIdx = new Map<number, BracketMatch[]>();
      const unknownRoundMatches: BracketMatch[] = [];
      for (const m of matches) {
        const idx = roundIndex(m.round);
        if (idx === -1) {
          unknownRoundMatches.push(m);
          continue;
        }
        const list = byRoundIdx.get(idx) ?? [];
        list.push(m);
        byRoundIdx.set(idx, list);
      }

      const orderedRounds: BracketRound[] = [];
      for (let i = 0; i < ROUND_ORDER.length; i++) {
        const list = byRoundIdx.get(i);
        if (list && list.length > 0) {
          orderedRounds.push({ label: ROUND_ORDER[i].label, matches: list });
        }
      }
      if (unknownRoundMatches.length > 0) {
        orderedRounds.push({
          label: 'Autres matchs',
          matches: unknownRoundMatches,
        });
      }

      setRounds(orderedRounds);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [competitionId, season]);

  return { rounds, isLoading };
}
