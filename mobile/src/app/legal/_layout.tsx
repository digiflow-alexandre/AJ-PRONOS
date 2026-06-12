import { Stack } from 'expo-router';

import { ModalCloseButton } from '@/components/modal-close-button';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function LegalLayout() {
  const c = useThemeColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitleStyle: { color: c.text, fontWeight: '600' },
        headerBackTitle: 'Retour',
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Informations légales',
          headerLeft: () => <ModalCloseButton />,
        }}
      />
      <Stack.Screen name="[slug]" options={{ title: '' }} />
    </Stack>
  );
}
