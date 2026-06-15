import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/splash-overlay';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { setupNotificationHandler } from '@/lib/push-notifications';
import { initRevenueCat } from '@/lib/revenuecat';

function RootStack() {
  const { session } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      {/* Pages légales accessibles depuis n'importe quel state (login ou app).
          Obligatoire pour la review Apple. */}
      <Stack.Screen name="legal" options={{ presentation: 'modal' }} />
      {/* Page Stats AJ Pronos détaillée, accessible depuis l'Accueil. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="stats" options={{ presentation: 'modal' }} />
        <Stack.Screen name="carnet" options={{ presentation: 'modal' }} />
        {/* Fiche pari ouvrable depuis l'Accueil/Carnet — au niveau racine
            pour éviter de polluer la sous-stack du tab Pronos quand on
            ouvre une fiche depuis ailleurs (cf bet/[id].tsx comment). */}
        <Stack.Screen name="bet/[id]" />
      </Stack.Protected>
    </Stack>
  );
}

function App() {
  const { session, isLoading } = useAuth();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {/* Le Stack rend dès le départ (même pendant isLoading) — l'écran
          initial sera masqué par le SplashOverlay au-dessus. Quand l'auth
          finit de charger ET que le splash a fini sa transition, l'app
          devient interactive. */}
      <RootStack />
      {!splashDone ? (
        <SplashOverlay
          ready={!isLoading}
          hasSession={!!session}
          onComplete={() => setSplashDone(true)}
        />
      ) : null}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  // Setup une seule fois : handler de notifs + init RevenueCat
  useEffect(() => {
    setupNotificationHandler();
    initRevenueCat();
  }, []);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}
