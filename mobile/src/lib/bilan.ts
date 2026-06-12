import { getBetStartDate } from '@/types/prono';
import type { AnyBet } from '@/types/prono';

export type Bilan = {
  /** Pronos résolus pris en compte. */
  total: number;
  wins: number;
  draws: number;
  losses: number;
  /** % de pronos gagnants (entiers, ex 67 pour 67%). */
  winRate: number;
  /** Cote moyenne sur la période (ex 1.85). */
  avgOdd: number;
};

/**
 * Calcule le bilan AJ Pronos sur les N derniers jours.
 * Inclut simples + combinés (tous les paris résolus comptent).
 * Pas de notion de mise/gain en € pour rester honnête.
 */
export function computeBilan(bets: AnyBet[], periodDays: number): Bilan {
  const cutoff = Date.now() - periodDays * 86_400_000;
  const resolved = bets.filter(
    (b) =>
      b.result !== 'pending' &&
      b.result !== 'live' &&
      new Date(getBetStartDate(b)).getTime() >= cutoff,
  );

  let wins = 0;
  let draws = 0;
  let losses = 0;
  let oddSum = 0;

  resolved.forEach((b) => {
    if (b.result === 'win') wins++;
    else if (b.result === 'loss') losses++;
    else if (b.result === 'void') draws++;
    // Cote : single → odd, combo → combinationOdd
    oddSum += b.type === 'single' ? b.odd : b.combinationOdd;
  });

  const total = resolved.length;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const avgOdd = total > 0 ? Math.round((oddSum / total) * 100) / 100 : 0;

  return { total, wins, draws, losses, winRate, avgOdd };
}

/**
 * Renvoie une salutation selon l'heure courante (matin / midi / soir).
 */
export function getGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 6) return 'Bonsoir';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
}
