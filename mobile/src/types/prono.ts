import type { SubscriptionTier } from './profile';
import type { ProNoStats } from './stats';

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
  result: PronoResult;
  finalScore?: string;

  // ===== Stats du match =====
  teamHomeForm?: FormSlot[];
  teamAwayForm?: FormSlot[];
  headToHead?: HeadToHead;
  contextNote?: string;
  absences?: string[];
  stats?: ProNoStats;
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
  /** Stats du match (pour Stats Center accessible par sélection). */
  stats?: ProNoStats;
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
  /**
   * Résultat global du combiné :
   * - pending : au moins une sélection pending (pas commencée)
   * - live    : au moins une sélection live (en cours), aucune perdue
   * - win     : TOUTES les sélections win
   * - loss    : AU MOINS UNE sélection loss
   * - void    : annulé global
   */
  result: PronoResult;
};

/** Union de tous les types de paris (simple ou combiné). */
export type AnyBet = Prono | ComboBet;

/**
 * Helper : retourne la date du PREMIER match d'un pari (pour le tri liste).
 * Pour un simple = sa matchStartAt. Pour un combo = min des matchStartAt des sélections.
 */
export function getBetStartDate(bet: AnyBet): string {
  if (bet.type === 'single') return bet.matchStartAt;
  return bet.selections.reduce(
    (min, s) => (new Date(s.matchStartAt) < new Date(min) ? s.matchStartAt : min),
    bet.selections[0]?.matchStartAt ?? new Date().toISOString(),
  );
}
