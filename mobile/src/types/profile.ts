export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'vip';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type Profile = {
  id: string;
  tier: SubscriptionTier | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus | null;
  revenuecat_user_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Hiérarchie d'accès — un tier donné débloque tout ce qui est en-dessous.
 * Utilisé par canAccess() dans use-profile.ts.
 */
export const TIER_LEVEL: Record<SubscriptionTier, number> = {
  trial: 1,
  starter: 1,
  pro: 2,
  vip: 3,
};
