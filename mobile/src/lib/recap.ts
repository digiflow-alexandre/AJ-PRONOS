/**
 * Logique du "bilan depuis la dernière visite".
 *
 * Règles :
 *  - Un pari est considéré "résolu" si son result est 'win', 'loss' ou 'void'.
 *  - La date de résolution approximative = date du dernier match du pari
 *    (pour un simple : matchStartAt ; pour un combo : max des matchStartAt
 *    des sélections).
 *  - On filtre les paris résolus dont la résolution est entre sinceISO et now.
 *  - Si sinceISO est null (1ère ouverture) → on ne montre rien, on set
 *    juste la date pour la prochaine fois.
 */

import type { AnyBet } from '@/types/prono';
import { getBetStartDate } from '@/types/prono';

export type RecapResolvedBet = {
  bet: AnyBet;
  /** Date approximative de résolution (= dernier match du pari). */
  resolvedAt: string;
  /** Vrai si TOUS les composants du pari (combo) ont gagné. */
  isWin: boolean;
};

export type RecapData = {
  /** Tous les paris résolus depuis la dernière visite. */
  resolvedBets: RecapResolvedBet[];
  wins: number;
  losses: number;
  voids: number;
  total: number;
  /** Ratio gagnés / total (0..1). 0 si total=0. */
  winRatio: number;
};

const RESOLVED_RESULTS = new Set(['win', 'loss', 'void']);

function isResolvedResult(result: AnyBet['result']): boolean {
  return RESOLVED_RESULTS.has(result);
}

export function computeRecap(
  bets: AnyBet[],
  sinceISO: string,
  nowISO: string,
): RecapData {
  const sinceMs = new Date(sinceISO).getTime();
  const nowMs = new Date(nowISO).getTime();

  const resolved: RecapResolvedBet[] = [];

  for (const bet of bets) {
    if (!isResolvedResult(bet.result)) continue;
    // Préférence : updatedAt (= date de marquage admin). Sinon fallback
    // sur la date du match (cas des fixtures statiques sans updatedAt).
    const resolvedAt = bet.updatedAt ?? getBetStartDate(bet);
    const t = new Date(resolvedAt).getTime();
    if (t > sinceMs && t <= nowMs) {
      resolved.push({
        bet,
        resolvedAt,
        isWin: bet.result === 'win',
      });
    }
  }

  // Tri du plus récent au plus ancien (pour affichage en haut du modal)
  resolved.sort(
    (a, b) =>
      new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime(),
  );

  const wins = resolved.filter((r) => r.bet.result === 'win').length;
  const losses = resolved.filter((r) => r.bet.result === 'loss').length;
  const voids = resolved.filter((r) => r.bet.result === 'void').length;
  const total = resolved.length;

  return {
    resolvedBets: resolved,
    wins,
    losses,
    voids,
    total,
    winRatio: total > 0 ? wins / total : 0,
  };
}

/**
 * Renvoie une phrase de Julien adaptée au ratio gagné/perdu.
 * Ton sobre, conforme ANJ — JAMAIS d'incitation à miser plus.
 */
export function getRecapJulienQuote(data: RecapData): string {
  if (data.total === 0) return '';
  const ratio = data.winRatio;
  if (ratio === 1) {
    return 'Soirée propre. On continue sur la méthode.';
  }
  if (ratio >= 0.66) {
    return 'Bonne soirée — sans s’enflammer. La méthode tient.';
  }
  if (ratio >= 0.34) {
    return 'Mi-figue mi-raisin. Demain est un autre jour.';
  }
  if (ratio > 0) {
    return 'Soirée difficile. On encaisse, on relit, on rebondit.';
  }
  return 'Soirée à oublier. La méthode reste, on rebondit demain.';
}
