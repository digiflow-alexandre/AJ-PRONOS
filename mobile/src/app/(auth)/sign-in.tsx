import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedButton, BrandedField } from '@/components/branded-button';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function SignInScreen() {
  const c = useThemeColors();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) setError(err);
    // Pas de redirect manuel : Stack.Protected dans _layout.tsx bascule
    // automatiquement sur (app) dès que la session apparaît.
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: c.gold }]}>
              — CONNEXION
            </Text>
            <Text style={[styles.title, { color: c.text }]}>Re-bonjour.</Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Accédez à vos pronostics, votre historique et le salon VIP.
            </Text>
          </View>

          <View style={{ gap: Spacing.three }}>
            <BrandedField
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="alex@ajpronos.fr"
            />
            <BrandedField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
            />
          </View>

          {error ? (
            <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
          ) : null}

          <BrandedButton
            label="Se connecter"
            loadingLabel="Connexion…"
            loading={loading}
            onPress={onSubmit}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textMuted }]}>
              Pas encore de compte ?{' '}
              <Link
                href="/(auth)/sign-up"
                style={[styles.footerLink, { color: c.text }]}>
                Créer un compte
              </Link>
            </Text>
          </View>

          <Text style={[styles.legal, { color: c.textDim }]}>
            +18 — les paris sportifs comportent des risques.{' '}
            <Text
              onPress={() => Linking.openURL('https://www.joueurs-info-service.fr')}
              style={{ textDecorationLine: 'underline' }}>
              joueurs-info-service.fr
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.four,
    justifyContent: 'center',
  },
  header: { gap: Spacing.two },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  error: {
    fontSize: 14,
  },
  footer: { alignItems: 'center' },
  footerText: { fontSize: 14 },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing.two,
  },
});
