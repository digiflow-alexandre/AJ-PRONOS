import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Bouton "← Retour" pour quitter un écran (style iOS standard).
 * À utiliser dans le `headerLeft` du Stack.Screen.
 */
export function ModalCloseButton({ label = 'Retour' }: { label?: string }) {
  const c = useThemeColors();
  const router = useRouter();

  function onPress() {
    // Si on est sur une sub-route du stack modal (ex carnet/[id]), back
    // pop juste cette page sans fermer le modal entier.
    if (router.canGoBack()) {
      router.back();
      return;
    }
    // Sinon (= on est sur la racine du modal, ex carnet/index), faut
    // dismiss le modal lui-même pour revenir à l'écran qui était derrière.
    router.dismiss();
  }

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.btn,
        { opacity: pressed ? 0.5 : 1 },
      ]}>
      <SymbolView
        name="chevron.left"
        size={18}
        tintColor={c.gold}
        weight="semibold"
      />
      <Text style={[styles.label, { color: c.gold }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginLeft: -6, // compense le padding pour aligner sur le bord
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});
