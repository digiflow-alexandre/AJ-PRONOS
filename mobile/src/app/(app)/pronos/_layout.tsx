import { Stack } from 'expo-router';

/**
 * Stack interne à l'onglet Pronos : permet la sous-route [id] (fiche
 * détaillée) de s'empiler par-dessus la liste sans casser le NativeTabs
 * parent. Sans ce _layout, NativeTabs ne route pas sur le sous-écran.
 */
export default function PronosLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    />
  );
}
