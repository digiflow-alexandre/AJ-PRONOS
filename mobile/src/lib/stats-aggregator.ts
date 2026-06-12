/**
 * Agrégation des stats AJ Pronos sur l'ensemble des paris publiés.
 * Tout est dérivé des fixtures (V1) — sera remplacé par requêtes Supabase
 * une fois le backend live.
 */

import type { AnyBet, Sport } from '@/types/prono';
import { getBetStartDate } from '@/types/prono';

export type GlobalStats = {
  total: number;
  wins: number;
  losses: number;
  voids: number;
  pending: number;
  winRate: number; // 0..100 entier
  avgOdd: number; // cote moyenne sur les résolus (2 décimales)
  /** ROI théorique en %, calculé avec mise de 1u constante : (gain - mise) / mise.
   *  Pour les win : on récupère mise × cote. Pour les loss : on perd mise. */
  theoreticalRoi: number; // -100..+inf (entier %)
};

export type MonthlyStats = {
  /** Année-Mois (YYYY-MM), ex '2026-05'. Sert de clé. */
  ym: string;
  /** Libellé humain, ex 'Mai 2026'. */
  label: string;
  stats: GlobalStats;
};

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function getBetOdd(bet: AnyBet): number {
  return bet.type === 'single' ? bet.odd : bet.combinationOdd;
}

function computeStatsFrom(bets: AnyBet[]): GlobalStats {
  let wins = 0;
  let losses = 0;
  let voids = 0;
  let pending = 0;
  let oddSum = 0;
  let resolved = 0;
  let roiSum = 0; // somme des (gain - mise) en unités de mise 1

  for (const bet of bets) {
    if (bet.result === 'pending' || bet.result === 'live') {
      pending++;
      continue;
    }
    const odd = getBetOdd(bet);
    resolved++;
    oddSum += odd;
    if (bet.result === 'win') {
      wins++;
      roiSum += odd - 1; // gain net en unités
    } else if (bet.result === 'loss') {
      losses++;
      roiSum -= 1; // perte sèche de la mise
    } else if (bet.result === 'void') {
      voids++;
      // Aucun impact sur ROI (mise rendue)
    }
  }

  return {
    total: bets.length,
    wins,
    losses,
    voids,
    pending,
    winRate: resolved > 0 ? Math.round((wins / resolved) * 100) : 0,
    avgOdd: resolved > 0 ? Math.round((oddSum / resolved) * 100) / 100 : 0,
    theoreticalRoi: resolved > 0 ? Math.round((roiSum / resolved) * 100) : 0,
  };
}

export function computeGlobalStats(bets: AnyBet[]): GlobalStats {
  return computeStatsFrom(bets);
}

export function computeStatsBySport(
  bets: AnyBet[],
  sport: Sport,
): GlobalStats {
  return computeStatsFrom(
    bets.filter((b) => {
      if (b.type === 'single') return b.sport === sport;
      // Pour un combo : on compte le pari si AU MOINS une sélection est de ce sport
      return b.selections.some((s) => s.sport === sport);
    }),
  );
}

export function computeStatsByMonth(bets: AnyBet[]): MonthlyStats[] {
  const buckets = new Map<string, AnyBet[]>();
  for (const bet of bets) {
    const d = new Date(getBetStartDate(bet));
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const arr = buckets.get(ym) ?? [];
    arr.push(bet);
    buckets.set(ym, arr);
  }
  const monthlies: MonthlyStats[] = [];
  for (const [ym, betsOfMonth] of buckets) {
    const [year, month] = ym.split('-').map((s) => parseInt(s, 10));
    monthlies.push({
      ym,
      label: `${MONTH_NAMES[month - 1]} ${year}`,
      stats: computeStatsFrom(betsOfMonth),
    });
  }
  // Tri du plus récent au plus ancien
  monthlies.sort((a, b) => (a.ym < b.ym ? 1 : -1));
  return monthlies;
}
