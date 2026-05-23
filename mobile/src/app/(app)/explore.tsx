import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function ExploreScreen() {
  const c = useThemeColors();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        <Text style={[styles.eyebrow, { color: c.gold }]}>— PRONOSTICS</Text>
        <Text style={[styles.title, { color: c.text }]}>Bientôt.</Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          La liste des pronostics du jour apparaîtra ici une fois la base
          Supabase + l&apos;agent IA branchés. On y arrive.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
});
