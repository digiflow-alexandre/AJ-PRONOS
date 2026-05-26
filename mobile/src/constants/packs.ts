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
      'Tous les pronos foot (J-1 + 1 prono J)',
      'Accès app & espace membre',
      'Notifications push in-app',
      'Historique complet',
    ],
  },
  {
    tier: 'pro',
    name: 'Pro',
    monthly: '19,90 €',
    yearly: '191 €',
    monthlyAmount: 19.9,
    yearlyAmount: 191,
    baseline: 'Pour parier avec méthode.',
    features: [
      'Pronos foot + tennis temps réel (J)',
      'Recommandations personnalisées',
      'Analyse détaillée de chaque pari',
      'Stats & ROI personnels',
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
      'Salon privé in-app avec l’analyste',
      'Réunion Microsoft Teams\nhebdomadaire',
      'Pronos sur les gros événements (Champions League, finales)',
      'ROI tracking personnalisé',
    ],
    cap: '50 places max',
  },
];

/** Économie annuelle vs mensuel (en euros) — affichée sous le prix annuel. */
export function yearlySavings(pack: Pack): number {
  return pack.monthlyAmount * 12 - pack.yearlyAmount;
}
