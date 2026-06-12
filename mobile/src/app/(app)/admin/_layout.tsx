import { Stack } from 'expo-router';

import { useThemeColors } from '@/lib/use-theme-colors';

export default function AdminLayout() {
  const c = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitleStyle: { color: c.text, fontWeight: '600' },
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="new-single"
        options={{ title: 'Nouveau prono', headerBackTitle: 'Admin' }}
      />
      <Stack.Screen
        name="new-combo"
        options={{ title: 'Nouveau combiné', headerBackTitle: 'Admin' }}
      />
    </Stack>
  );
}
