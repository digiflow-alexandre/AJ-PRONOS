import type { Sport } from './prono';

export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'vip';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export type { Sport };

export type RiskLevel = 'prudent' | 'equilibre' | 'audacieux';

export type ProfileRole = 'user' | 'validator' | 'admin';

export type Profile = {
  id: string;
  tier: SubscriptionTier | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  subscription_status: SubscriptionStatus | null;
  revenuecat_user_id: string | null;
  stripe_customer_id: string | null;
  // Identité publique
  display_name: string | null;       // pseudo unique (citext en DB, 3-20 chars)
  date_of_birth: string | null;      // ISO date (YYYY-MM-DD)
  // Onboarding
  onboarding_completed_at: string | null;
  sports_followed: Sport[];
  risk_level: RiskLevel;
  notifications_opted_in: boolean;
  // Permissions
  role: ProfileRole;
  // Push notifications
  expo_push_token: string | null;
  // Soft delete (RGPD + Apple Guideline 5.1.1.v)
  deleted_at: string | null;
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
