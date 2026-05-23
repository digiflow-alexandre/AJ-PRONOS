import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function HomeScreen() {
  const c = useThemeColors();
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>
            — ESPACE MEMBRE
          </Text>
          <Text style={[styles.title, { color: c.text }]}>Bienvenue.</Text>
          <Text style={[styles.subtitle, { color: c.textMuted }]}>
            Connecté en tant que{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>
              {session?.user.email}
            </Text>
            . Le tableau de bord pronostics arrive bientôt.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <BrandedButton
          label="Se déconnecter"
          variant="ghost"
          onPress={signOut}
        />

        <Text style={[styles.legal, { color: c.textDim }]}>
          +18 — les paris sportifs comportent des risques.
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
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
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
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
