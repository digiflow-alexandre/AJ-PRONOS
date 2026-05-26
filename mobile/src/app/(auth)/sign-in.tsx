import { Image } from 'expo-image';
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
import { LOGIN_HEADER_LOGO } from '@/components/splash-overlay';
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Logo header — positionné pour matcher la fin de l'animation splash */}
          <View
            style={[
              styles.logoHeader,
              { paddingTop: LOGIN_HEADER_LOGO.topPadding },
            ]}>
            <Image
              source={require('@/assets/images/aj-pronos-logo.png')}
              style={{
                width: LOGIN_HEADER_LOGO.width,
                height: LOGIN_HEADER_LOGO.height,
              }}
              contentFit="contain"
            />
          </View>

          <View style={styles.formBlock}>
            <Text style={[styles.eyebrow, { color: c.gold }]}>
              — ESPACE MEMBRE
            </Text>

            <View style={styles.fields}>
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
          </View>

          <View style={styles.bottom}>
            <Text style={[styles.footerText, { color: c.textMuted }]}>
              Pas encore de compte ?{' '}
              <Link
                href="/(auth)/sign-up"
                style={[styles.footerLink, { color: c.text }]}>
                Créer un compte
              </Link>
            </Text>

            <Text style={[styles.legal, { color: c.textDim }]}>
              +18 — les paris sportifs comportent des risques.{' '}
              <Text
                onPress={() => Linking.openURL('https://www.joueurs-info-service.fr')}
                style={{ textDecorationLine: 'underline' }}>
                joueurs-info-service.fr
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
  logoHeader: {
    alignItems: 'center',
  },
  formBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.five,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
  },
  fields: {
    gap: Spacing.four,
  },
  error: {
    fontSize: 14,
    textAlign: 'center',
  },
  bottom: {
    gap: Spacing.four,
    alignItems: 'center',
  },
  footerText: { fontSize: 14 },
  footerLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  legal: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.three,
  },
});
