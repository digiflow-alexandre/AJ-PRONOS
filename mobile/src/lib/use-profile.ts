import { useCallback, useEffect, useState } from 'react';

import type {
  Profile,
  RiskLevel,
  Sport,
  SubscriptionTier,
} from '@/types/profile';
import { TIER_LEVEL } from '@/types/profile';

import { useAuth } from './auth-context';
import { supabase } from './supabase';

export type OnboardingPrefs = {
  displayName: string;
  dateOfBirth: string; // ISO date YYYY-MM-DD
  sportsFollowed: Sport[];
  riskLevel: RiskLevel;
  notificationsOptedIn: boolean;
};

type UseProfileResult = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  /** Le trial est-il en cours (tier=trial ET trial_ends_at > now) ? */
  isTrialActive: boolean;
  /** Le trial a-t-il expiré (tier=trial ET trial_ends_at < now) ? */
  isTrialExpired: boolean;
  /** Jours restants sur l'essai gratuit (0 si expiré ou pas en trial). */
  trialDaysLeft: number;
  /** L'utilisateur peut-il accéder à un contenu d'un niveau donné ?
   *  Trial actif = équivalent Starter uniquement (PAS d'accès Pro/VIP).
   *  Trial expiré = aucun accès. */
  canAccess: (requiredTier: SubscriptionTier) => boolean;
  /** Démarre l'essai gratuit 7 jours (tier=trial, dates posées). */
  startTrial: () => Promise<{ error: string | null }>;
  /** L'utilisateur a-t-il fini son onboarding ? */
  isOnboarded: boolean;
  /** Marque l'onboarding comme terminé et persiste les préférences. */
  completeOnboarding: (
    prefs: OnboardingPrefs,
  ) => Promise<{ error: string | null }>;
  /** Vérifie si un pseudo est disponible (via RPC Supabase, case-insensitive). */
  checkDisplayNameAvailable: (name: string) => Promise<boolean>;
  /** Soft-delete le compte (marque deleted_at + anonymise display_name).
   *  Apple Guideline 5.1.1.v : suppression doit être initiée depuis l'app. */
  deleteAccount: () => Promise<{ error: string | null }>;
  /** L'utilisateur est-il admin ou validator (= accès admin app) ? */
  isStaff: boolean;
  /** Recharge manuellement le profile depuis la DB. */
  refresh: () => Promise<void>;
};

const TRIAL_DAYS = 7;
const TICK_INTERVAL_MS = 60_000; // recalcul du J-X chaque minute

type TrialState = { isActive: boolean; isExpired: boolean; daysLeft: number };

function computeTrialState(profile: Profile | null, nowMs: number): TrialState {
  if (!profile || profile.tier !== 'trial' || !profile.trial_ends_at) {
    return { isActive: false, isExpired: false, daysLeft: 0 };
  }
  const ms = new Date(profile.trial_ends_at).getTime() - nowMs;
  return {
    isActive: ms > 0,
    isExpired: ms <= 0,
    daysLeft: Math.max(0, Math.ceil(ms / 86_400_000)),
  };
}

export function useProfile(): UseProfileResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trial, setTrial] = useState<TrialState>({
    isActive: false,
    isExpired: false,
    daysLeft: 0,
  });

  const fetchProfile = useCallback(
    async (uid: string, signal?: AbortSignal) => {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();
      if (signal?.aborted) return;
      if (err) {
        setError(err.message);
        setProfile(null);
      } else {
        setError(null);
        setProfile(data as Profile);
      }
      setIsLoading(false);
    },
    [],
  );

  // Chargement initial + souscription Realtime
  useEffect(() => {
    if (!userId) {
      // Reset volontaire à la déconnexion (signal externe → reset interne,
      // pattern légitime malgré la règle stricte React 19).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfile(null);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    setIsLoading(true);
    fetchProfile(userId, ac.signal);

    // ID unique par setup pour éviter les collisions de channel name quand
    // useProfile() est utilisé dans plusieurs écrans ou en strict-mode (le
    // mount initial est doublé en dev). Math.random() est confiné dans
    // l'effet — interdit en render sous React 19.
    const channelName = `profiles:${userId}:${Math.random().toString(36).slice(2, 10)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        },
      )
      .subscribe();

    return () => {
      ac.abort();
      supabase.removeChannel(channel);
    };
  }, [userId, fetchProfile]);

  // Tick périodique pour mettre à jour le J-X de l'essai gratuit.
  // Date.now() est confiné dans l'effet (interdit en render sous React 19).
  useEffect(() => {
    function tick() {
      setTrial(computeTrialState(profile, Date.now()));
    }
    tick();
    const id = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, [profile]);

  const canAccess = useCallback(
    (requiredTier: SubscriptionTier) => {
      if (!profile) return false;
      // Staff (admin / validator = Alex & Julien) → accès total à tous
      // les pronos peu importe leur tier minimum. Logique : ils publient,
      // ils doivent pouvoir tout consulter pour QA.
      if (profile.role === 'admin' || profile.role === 'validator') {
        return true;
      }
      if (!profile.tier) return false;
      // Trial expiré = aucun accès, même si tier en DB est encore 'trial'
      if (trial.isExpired) return false;
      // Trial actif = équivalent Starter (TIER_LEVEL.trial = TIER_LEVEL.starter = 1)
      // donc l'utilisateur ne peut accéder qu'aux pronos starter, pas Pro/VIP.
      return TIER_LEVEL[profile.tier] >= TIER_LEVEL[requiredTier];
    },
    [profile, trial.isExpired],
  );

  const startTrial = useCallback(async () => {
    if (!userId) return { error: 'Pas de session.' };
    const now = new Date();
    const ends = new Date(now.getTime() + TRIAL_DAYS * 86_400_000);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        tier: 'trial',
        trial_started_at: now.toISOString(),
        trial_ends_at: ends.toISOString(),
        subscription_status: 'trialing',
      })
      .eq('id', userId);
    if (err) return { error: err.message };
    await fetchProfile(userId);
    return { error: null };
  }, [userId, fetchProfile]);

  const completeOnboarding = useCallback(
    async (prefs: OnboardingPrefs) => {
      if (!userId) return { error: 'Pas de session.' };
      const { error: err } = await supabase
        .from('profiles')
        .update({
          display_name: prefs.displayName,
          date_of_birth: prefs.dateOfBirth,
          onboarding_completed_at: new Date().toISOString(),
          sports_followed: prefs.sportsFollowed,
          risk_level: prefs.riskLevel,
          notifications_opted_in: prefs.notificationsOptedIn,
        })
        .eq('id', userId);
      if (err) return { error: err.message };
      await fetchProfile(userId);
      return { error: null };
    },
    [userId, fetchProfile],
  );

  /** Vérifie via RPC si un pseudo est disponible (case-insensitive). */
  const checkDisplayNameAvailable = useCallback(
    async (name: string): Promise<boolean> => {
      const { data, error: err } = await supabase.rpc(
        'check_display_name_available',
        { p_name: name },
      );
      if (err) return false; // En cas d'erreur, on considère "indispo" par sécurité
      return data === true;
    },
    [],
  );

  const deleteAccount = useCallback(async () => {
    if (!userId) return { error: 'Pas de session.' };
    // Soft delete : on marque deleted_at + anonymise le pseudo public.
    // L'email reste dans auth.users car non modifiable côté client (Apple
    // exige juste que la suppression soit initiée depuis l'app, pas que
    // le hard delete soit immédiat). Edge Function quotidienne purgera
    // les comptes deleted_at > 30 jours.
    const { error: err } = await supabase
      .from('profiles')
      .update({
        deleted_at: new Date().toISOString(),
        display_name: null,
        expo_push_token: null,
      })
      .eq('id', userId);
    if (err) return { error: err.message };
    return { error: null };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    await fetchProfile(userId);
  }, [userId, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    isTrialActive: trial.isActive,
    isTrialExpired: trial.isExpired,
    trialDaysLeft: trial.daysLeft,
    canAccess,
    startTrial,
    isOnboarded: !!profile?.onboarding_completed_at,
    completeOnboarding,
    checkDisplayNameAvailable,
    deleteAccount,
    isStaff: profile?.role === 'admin' || profile?.role === 'validator',
    refresh,
  };
}
