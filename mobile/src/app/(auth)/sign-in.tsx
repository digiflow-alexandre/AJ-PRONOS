import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandedButton, BrandedField } from '@/components/branded-button';
import { LOGIN_HEADER_LOGO } from '@/components/splash-overlay';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import {
  authenticateWithBiometric,
  biometricLabel,
  disableBiometricLogin,
  enableBiometricLogin,
  getBiometricType,
  isBiometricAvailable,
  isBiometricEnabled,
  type BiometricType,
} from '@/lib/biometric-auth';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function SignInScreen() {
  const c = useThemeColors();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Biométrie : on check au mount si dispo + déjà activée par l'user
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioType, setBioType] = useState<BiometricType>('unknown');
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable();
      if (!available) return;
      const type = await getBiometricType();
      const enabled = await isBiometricEnabled();
      setBioAvailable(true);
      setBioType(type);
      setBioEnabled(enabled);
    })();
  }, []);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    // Login réussi → si biométrie dispo et pas encore activée, on propose
    if (bioAvailable && !bioEnabled) {
      const label = biometricLabel(bioType);
      Alert.alert(
        `Activer ${label} ?`,
        `Connecte-toi plus rapidement avec ${label} la prochaine fois.\n\nTon mot de passe sera stocké de manière chiffrée dans le Keychain iOS.`,
        [
          { text: 'Plus tard', style: 'cancel' },
          {
            text: 'Activer',
            onPress: async () => {
              await enableBiometricLogin(email.trim(), password);
            },
          },
        ],
      );
    } else if (bioEnabled) {
      // Si déjà activée, on met à jour les credentials stockés au cas où
      // l'user a changé son mot de passe
      await enableBiometricLogin(email.trim(), password);
    }
    // Pas de redirect manuel : Stack.Protected dans _layout.tsx bascule
    // automatiquement sur (app) dès que la session apparaît.
  }

  async function onBiometricLogin() {
    setError(null);
    setBioLoading(true);
    const creds = await authenticateWithBiometric(bioType);
    if (!creds) {
      setBioLoading(false);
      return;
    }
    const { error: err } = await signIn(creds.email, creds.password);
    setBioLoading(false);
    if (err) {
      // Le mot de passe stocké ne marche plus (changement de password ?)
      // → on désactive la biométrie pour forcer un nouveau login manuel.
      setError(
        'Connexion biométrique échouée. Connecte-toi avec ton mot de passe.',
      );
      await disableBiometricLogin();
      setBioEnabled(false);
    }
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
                placeholder="ton@email.fr"
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

            {/* Bouton biométrie — affiché seulement si activée */}
            {bioAvailable && bioEnabled ? (
              <Pressable
                onPress={onBiometricLogin}
                disabled={bioLoading}
                style={({ pressed }) => [
                  styles.bioBtn,
                  {
                    borderColor: c.gold,
                    backgroundColor: c.bgWarm,
                    opacity: pressed || bioLoading ? 0.7 : 1,
                  },
                ]}>
                <SymbolView
                  name={bioType === 'face' ? 'faceid' : 'touchid'}
                  size={20}
                  tintColor={c.gold}
                  weight="semibold"
                />
                <Text style={[styles.bioBtnText, { color: c.text }]}>
                  {bioLoading
                    ? 'Authentification…'
                    : `Se connecter avec ${biometricLabel(bioType)}`}
                </Text>
              </Pressable>
            ) : null}
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

            <Link
              href="/legal"
              style={[styles.legalLink, { color: c.textMuted }]}>
              Informations légales
            </Link>
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
  legalLink: {
    fontSize: 12,
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  bioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  bioBtnText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
