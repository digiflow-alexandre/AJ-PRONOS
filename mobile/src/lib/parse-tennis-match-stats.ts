// AJ Pronos — Parser des stats fines d'un match tennis.
//
// L'API api-tennis.com retourne dans get_fixtures un champ non documenté
// `statistics[]` (confirmé en live) qui contient une mine d'or de stats
// fines par joueur et par période (match / set1 / set2…).
//
// Format brut d'une entrée :
//   {
//     player_key: "1905",
//     stat_period: "match",  // ou "set1", "set2"…
//     stat_type: "Service",  // ou "Return", "Points", "Games"
//     stat_name: "Aces",
//     stat_value: "12",
//     stat_won: 12,
//     stat_total: null,
//   }
//
// On filtre sur stat_period='match' pour ce joueur, puis on map les
// stat_name vers nos clés normalisées.

import type { TennisMatchFineStats } from '@/types/tennis-stats';

type RawStatRow = {
  player_key?: string;
  stat_period?: string;
  stat_type?: string;
  stat_name?: string;
  stat_value?: string;
  stat_won?: number | null;
  stat_total?: number | null;
};

function parseIntOrNull(s: string | undefined | null): number | null {
  if (s == null || s === '') return null;
  const n = parseInt(String(s).replace(/[^0-9-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

function parsePctOrNull(s: string | undefined | null): number | null {
  if (s == null || s === '') return null;
  const match = String(s).match(/(\d+(?:\.\d+)?)\s*%?/);
  if (!match) return null;
  return Math.round(parseFloat(match[1]));
}

/**
 * Parse le tennis_statistics brut + contexte du match → stats fines pour
 * UN joueur (celui dont le player_key est passé). Retourne null si :
 *   - statistics absent / vide
 *   - aucune entrée stat_period='match' pour ce player_key
 */
export function parseTennisMatchStats(
  statistics: unknown,
  playerApiKey: number | string,
  context: {
    opponent: string;
    date: string;
    scoreSets: string;
    result: 'V' | 'D';
  },
): TennisMatchFineStats | null {
  if (!Array.isArray(statistics) || statistics.length === 0) return null;
  const playerKey = String(playerApiKey);
  const rows = (statistics as RawStatRow[]).filter(
    (r) => String(r.player_key) === playerKey && r.stat_period === 'match',
  );
  if (rows.length === 0) return null;

  const get = (name: string): RawStatRow | undefined =>
    rows.find((r) => r.stat_name?.toLowerCase() === name.toLowerCase());

  const aces = get('Aces');
  const df = get('Double Faults');
  const firstServe = get('1st serve percentage');
  const firstServeWon = get('1st serve points won');
  const secondServeWon = get('2nd serve points won');
  const bpSaved = get('Break Points Saved');
  const bpConverted = get('Break Points Converted');
  const winners = get('Winners');
  const ues = get('Unforced errors');
  const totalPtsWon = get('Total Points Won');

  return {
    opponent: context.opponent,
    date: context.date,
    scoreSets: context.scoreSets,
    result: context.result,
    aces: parseIntOrNull(aces?.stat_value),
    doubleFaults: parseIntOrNull(df?.stat_value),
    firstServePct: parsePctOrNull(firstServe?.stat_value),
    firstServePointsWon: parsePctOrNull(firstServeWon?.stat_value),
    secondServePointsWon: parsePctOrNull(secondServeWon?.stat_value),
    breakPointsSaved:
      bpSaved?.stat_won != null && bpSaved.stat_total != null
        ? { won: bpSaved.stat_won, total: bpSaved.stat_total }
        : null,
    breakPointsConverted:
      bpConverted?.stat_won != null && bpConverted.stat_total != null
        ? { won: bpConverted.stat_won, total: bpConverted.stat_total }
        : null,
    winners: parseIntOrNull(winners?.stat_value),
    unforcedErrors: parseIntOrNull(ues?.stat_value),
    totalPointsWon: parsePctOrNull(totalPtsWon?.stat_value),
  };
}
