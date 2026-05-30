import type { SubscriptionTier } from '@/types/profile';

export type Pack = {
  tier: Exclude<SubscriptionTier, 'trial'>;
  name: string;
  monthly: string;
  yearly: string;
  monthlyAmount: number; // pour comparaison / calcul économie
  yearlyAmount: number;
  baseline: string; // 1 phrase pour la card
  features: string[]; // bullet points
  featured?: boolean; // true = card mise en avant
  badge?: string;
  cap?: string; // ex: "50 places max"
};

/**
 * Packs validés visio Julien 2026-05-30.
 * Toutes les fonctionnalités de base (analyse, ROI, carnet perso) sont
 * accessibles à TOUS les packs. La différenciation se joue sur :
 *  - le nombre de pronos quotidiens (1 vs 3)
 *  - l'accès au salon VIP
 */
export const PACKS: Pack[] = [
  {
    tier: 'starter',
    name: 'Starter',
    monthly: '9,90 €',
    yearly: '95 €',
    monthlyAmount: 9.9,
    yearlyAmount: 95,
    baseline: 'L’essentiel pour démarrer.',
    features: [
      '1 prono / jour (foot ou tennis)',
      'Analyse complète de chaque pari',
      'Carnet personnel + ROI',
      'Notifications push',
    ],
    badge: '7 jours offerts',
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthly: '19,90 €',
    yearly: '191 €',
    monthlyAmount: 19.9,
    yearlyAmount: 191,
    baseline: 'Plus de pronos, plus d’opportunités.',
    features: [
      '2 pronos / jour de notre analyste',
      '1 pari IA validé par Julien en plus',
      'Analyse complète + carnet + ROI',
      'Notifications push',
    ],
    featured: true,
    badge: 'Le plus populaire',
  },
  {
    tier: 'vip',
    name: 'VIP',
    monthly: '49,90 €',
    yearly: '479 €',
    monthlyAmount: 49.9,
    yearlyAmount: 479,
    baseline: 'L’accès direct à l’analyste.',
    features: [
      'Tout le pack Pro inclus',
      'Salon privé avec Julien & les VIP',
      'Coaching privé sur demande',
      'Pronos sur les gros événements',
    ],
    cap: '50 places max',
  },
];

/** Économie annuelle vs mensuel (en euros) — affichée sous le prix annuel. */
export function yearlySavings(pack: Pack): number {
  return pack.monthlyAmount * 12 - pack.yearlyAmount;
}
