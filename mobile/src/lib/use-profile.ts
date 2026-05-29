import { useCallback, useEffect, useState } from 'react';

import type { Profile, SubscriptionTier } from '@/types/profile';
import { TIER_LEVEL } from '@/types/profile';

import { useAuth } from './auth-context';
import { supabase } from './supabase';

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
      if (!profile?.tier) return false;
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
    refresh,
  };
}
