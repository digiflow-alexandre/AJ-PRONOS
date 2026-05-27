import type { SubscriptionTier } from './profile';
import type { ProNoStats } from './stats';

export type Sport = 'foot' | 'tennis';

export type PronoResult = 'pending' | 'win' | 'loss' | 'void';

/** Résultat d'un match récent : W = win, D = draw, L = loss. */
export type FormSlot = 'W' | 'D' | 'L';

export type HeadToHead = {
  homeWins: number;
  draws: number;       // 0 pour le tennis (pas de nul)
  awayWins: number;
  period: string;      // ex: "10 dernières confrontations"
};

export type Prono = {
  id: string;
  sport: Sport;
  competition: string;       // ex: "Ligue 1 · J32"
  teamHome: string;
  teamAway: string;
  teamHomeLogo?: string;     // URL (foot) ou drapeau pays (tennis)
  teamAwayLogo?: string;
  matchStartAt: string;       // ISO datetime
  prediction: string;         // ex: "Victoire PSG", "Plus de 2,5 buts"
  odd: number;                // 1.85
  confidence: 1 | 2 | 3 | 4 | 5;
  reasoning: string;          // argumentaire long pour la fiche détaillée
  minTier: Exclude<SubscriptionTier, 'trial'>; // starter / pro / vip
  publishedAt: string;
  result: PronoResult;        // 'pending' tant que le match n'est pas joué
  finalScore?: string;        // ex: "PSG 3-1 Lyon" (rempli quand result != pending)

  // ===== Stats du match (optionnel, affichées en fiche détaillée) =====
  /** 5 derniers résultats de l'équipe domicile (du plus récent au plus ancien). */
  teamHomeForm?: FormSlot[];
  teamAwayForm?: FormSlot[];
  /** Confrontations directes récentes. */
  headToHead?: HeadToHead;
  /** Ligne de contexte courte (classement, points d'écart, etc.) */
  contextNote?: string;
  /** Absents importants. */
  absences?: string[];
  /** Données stats détaillées pour le Stats Center (sheet). Optionnel. */
  stats?: ProNoStats;
};


