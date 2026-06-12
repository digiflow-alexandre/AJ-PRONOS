import type { SubscriptionTier } from './profile';
import type { ProNoStats } from './stats';
import type { TennisStats } from './tennis-stats';

export type Sport = 'foot' | 'tennis';

/**
 * Résultat d'un pari (simple OU sélection d'un combiné OU combiné global).
 * - pending  : pas encore commencé
 * - live     : match en cours, résultat pas encore tranché (auto via API-Football)
 * - win      : gagné
 * - loss     : perdu
 * - void     : annulé (match annulé, pari ambigu, etc.)
 */
export type PronoResult = 'pending' | 'live' | 'win' | 'loss' | 'void';

/** Résultat d'un match récent : W = win, D = draw, L = loss. */
export type FormSlot = 'W' | 'D' | 'L';

export type HeadToHead = {
  homeWins: number;
  draws: number;       // 0 pour le tennis (pas de nul)
  awayWins: number;
  period: string;      // ex: "10 dernières confrontations"
};

/**
 * Pari simple (1 match, 1 prono).
 */
export type Prono = {
  type: 'single';            // discriminant
  id: string;
  sport: Sport;
  competition: string;       // ex: "Ligue 1 · J32"
  teamHome: string;
  teamAway: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
  matchStartAt: string;
  prediction: string;
  odd: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  minTier: Exclude<SubscriptionTier, 'trial'>;
  publishedAt: string;
  /** Date du dernier update du pari côté DB (= date de marquage win/loss
   *  par l'admin). Sert au filtrage du DailyRecapModal pour montrer les
   *  paris "fraîchement résolus". Undefined pour les fixtures statiques. */
  updatedAt?: string;
  result: PronoResult;
  finalScore?: string;

  // ===== Stats du match =====
  teamHomeForm?: FormSlot[];
  teamAwayForm?: FormSlot[];
  headToHead?: HeadToHead;
  contextNote?: string;
  absences?: string[];
  stats?: ProNoStats;
  tennisStats?: TennisStats;

  // ===== Capture du ticket bookmaker (preuve "Julien joue vraiment") =====
  bookmakerScreenshotUrl?: string;
  bookmakerName?: string; // ex "Winamax"
};

/**
 * Une sélection d'un combiné = un mini-prono (1 match, 1 pari).
 * Structure similaire à Prono mais sans le tier, sans l'analyse longue,
 * et avec une mini-analyse spécifique à la sélection.
 */
export type ComboBetSelection = {
  sport: Sport;
  competition: string;
  teamHome: string;
  teamAway: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
  matchStartAt: string;
  prediction: string;
  odd: number;
  /** Analyse courte par sélection (1-2 phrases) — utilisée dans la fiche détaillée. */
  miniReasoning: string;
  result: PronoResult;
  finalScore?: string;
  /** Stats du match foot (pour Stats Center accessible par sélection). */
  stats?: ProNoStats;
  /** Stats du match tennis (pour Stats Center tennis). */
  tennisStats?: TennisStats;
};

/**
 * Pari combiné : N sélections, gagne SI TOUTES les sélections gagnent.
 * Cote totale = produit des cotes des sélections.
 */
export type ComboBet = {
  type: 'combo';             // discriminant
  id: string;
  selections: ComboBetSelection[];
  /** Produit des cotes des sélections, stocké pour cohérence affichage. */
  combinationOdd: number;
  confidence: 1 | 2 | 3 | 4 | 5;
  /** Analyse globale Julien : pourquoi ces N paris ensemble. */
  reasoning: string;
  minTier: Exclude<SubscriptionTier, 'trial'>;
  publishedAt: string;
  /** Date du dernier update du combiné côté DB. Sert au DailyRecapModal. */
  updatedAt?: string;
  /**
   * Résultat global du combiné :
   * - pending : au moins une sélection pending (pas commencée)
   * - live    : au moins une sélection live (en cours), aucune perdue
   * - win     : TOUTES les sélections win
   * - loss    : AU MOINS UNE sélection loss
   * - void    : annulé global
   */
  result: PronoResult;

  // ===== Capture du ticket bookmaker (preuve "Julien joue vraiment") =====
  bookmakerScreenshotUrl?: string;
  bookmakerName?: string;
};

/** Union de tous les types de paris (simple ou combiné). */
export type AnyBet = Prono | ComboBet;

/**
 * Helper : retourne la date pivot d'un pari pour le tri (carnet, stats…).
 * Pour un simple = sa matchStartAt.
 * Pour un combo = la date du DERNIER match (= jour où il sera entièrement
 * résolu) — c'est la date qui compte pour le bilan / l'historique.
 */
export function getBetStartDate(bet: AnyBet): string {
  if (bet.type === 'single') return bet.matchStartAt;
  return bet.selections.reduce(
    (max, s) => (new Date(s.matchStartAt) > new Date(max) ? s.matchStartAt : max),
    bet.selections[0]?.matchStartAt ?? new Date().toISOString(),
  );
}

/**
 * Convertit une date en clé YYYY-MM-DD **dans le fuseau local de l'app**
 * (et pas en UTC). Important pour pas qu'un match "5 juin 1h heure FR"
 * (= 4 juin 23h UTC) se range sous le mauvais jour.
 */
export function localDayKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  // "sv-SE" est le seul locale qui formatte YYYY-MM-DD nativement.
  return date.toLocaleDateString('sv-SE');
}

/**
 * Helper : retourne les dates uniques (YYYY-MM-DD, locale) couvertes par
 * les matchs d'un pari. Pour un single = 1 date. Pour un combo = N dates
 * (1 par sélection, dédupliquées).
 *
 * Utilisé pour le bucketing par jour dans la liste Pronos : un combo
 * étalé sur 3 jours apparaît dans les 3 buckets (option A — 2026-06-05).
 */
export function getBetActiveDates(bet: AnyBet): string[] {
  const isoDates =
    bet.type === 'single'
      ? [bet.matchStartAt]
      : bet.selections.map((s) => s.matchStartAt);
  const dayKeys = new Set<string>();
  for (const iso of isoDates) {
    dayKeys.add(localDayKey(iso));
  }
  return Array.from(dayKeys).sort();
}

/**
 * Helper : compte le nombre de sélections d'un combo dont le match est
 * dans le passé (= jouées, en attente de marquage manuel par Julien).
 * Pour un single = 0 ou 1. Renvoie aussi le total pour afficher "X/N".
 */
export function getBetMatchesProgress(
  bet: AnyBet,
  now: Date = new Date(),
): { played: number; total: number } {
  if (bet.type === 'single') {
    const played = new Date(bet.matchStartAt) <= now ? 1 : 0;
    return { played, total: 1 };
  }
  const played = bet.selections.filter(
    (s) => new Date(s.matchStartAt) <= now,
  ).length;
  return { played, total: bet.selections.length };
}
