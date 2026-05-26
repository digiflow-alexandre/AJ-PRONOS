import type { SubscriptionTier } from './profile';

export type Sport = 'foot' | 'tennis';

export type PronoResult = 'pending' | 'win' | 'loss' | 'void';

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
};

