import { Stack } from 'expo-router';

import { ModalCloseButton } from '@/components/modal-close-button';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function StatsLayout() {
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        // Header transparent pour laisser voir l'image background du screen.
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: c.gold,
        headerTitleStyle: { color: c.text, fontWeight: '700' },
        headerBackTitle: 'Retour',
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Bilan AJ Pronos',
          headerLeft: () => <ModalCloseButton />,
        }}
      />
    </Stack>
  );
}
