import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
} from 'expo-router';
import { useState } from 'react';
import { useColorScheme } from 'react-native';

import { SplashOverlay } from '@/components/splash-overlay';
import { AuthProvider, useAuth } from '@/lib/auth-context';

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
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  );
}
