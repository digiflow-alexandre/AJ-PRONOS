import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { linkRevenueCatUser, unlinkRevenueCatUser } from './revenuecat';
import { supabase } from './supabase';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirm: boolean }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setIsLoading(false);
      if (data.session?.user) {
        // Lie le user RevenueCat (best-effort, ne bloque pas le rendu).
        void linkRevenueCatUser(
          data.session.user.id,
          data.session.user.email ?? undefined,
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // Sync RevenueCat selon l'event
      if (event === 'SIGNED_IN' && newSession?.user) {
        void linkRevenueCatUser(
          newSession.user.id,
          newSession.user.email ?? undefined,
        );
      } else if (event === 'SIGNED_OUT') {
        void unlinkRevenueCatUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        return {
          error: error
            ? 'Identifiants invalides. Vérifiez votre email et mot de passe.'
            : null,
        };
      },
      async signUp(email, password) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) return { error: error.message, needsEmailConfirm: false };
        // Si la session est nulle après signUp, c'est que Supabase attend
        // une confirmation par email.
        return { error: null, needsEmailConfirm: !data.session };
      },
      async signOut() {
        await supabase.auth.signOut();
      },
    }),
    [session, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
