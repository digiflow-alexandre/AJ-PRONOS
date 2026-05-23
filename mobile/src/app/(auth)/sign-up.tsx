import { Link } from 'expo-router';
import { useState } from 'react';
import {
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
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function SignUpScreen() {
  const c = useThemeColors();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit faire au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    if (!consent) {
      setError('Vous devez confirmer avoir 18 ans et accepter les CGU.');
      return;
    }

    setLoading(true);
    const { error: err, needsEmailConfirm } = await signUp(
      email.trim(),
      password,
    );
    setLoading(false);

    if (err) {
      setError(err);
      return;
    }
    if (needsEmailConfirm) {
      setSuccess(true);
    }
    // Si pas de confirmation requise, la session est créée et Stack.Protected
    // bascule sur (app) automatiquement.
  }

  if (success) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: c.bg }]}>
        <View style={[styles.container, { justifyContent: 'center' }]}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>— COMPTE CRÉÉ</Text>
          <Text style={[styles.title, { color: c.text }]}>
            Vérifiez vos emails.
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: c.textMuted, marginTop: Spacing.three },
            ]}>
            On vient d&apos;envoyer un lien de confirmation à{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>{email}</Text>.
            Cliquez dessus pour activer votre compte.
          </Text>
          <View style={{ marginTop: Spacing.five }}>
            <Link href="/(auth)/sign-in" asChild>
              <BrandedButton
                label="Retour à la connexion"
                variant="ghost"
                onPress={() => {}}
              />
            </Link>
          </View>
        </View>
      </SafeAreaView>
    );
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
              — INSCRIPTION
            </Text>
            <Text style={[styles.title, { color: c.text }]}>
              Créer un compte.
            </Text>
            <Text style={[styles.subtitle, { color: c.textMuted }]}>
              Trois minutes. Email de confirmation envoyé à la fin.
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
            />
            <BrandedField
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
            <BrandedField
              label="Confirmer le mot de passe"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
            />
          </View>

          <Pressable
            onPress={() => setConsent((v) => !v)}
            style={styles.consentRow}>
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: consent ? c.text : c.borderStrong,
                  backgroundColor: consent ? c.text : 'transparent',
                },
              ]}>
              {consent ? (
                <Text style={{ color: c.ctaText, fontSize: 12 }}>✓</Text>
              ) : null}
            </View>
            <Text style={[styles.consentText, { color: c.textMuted }]}>
              Je certifie avoir 18 ans ou plus, je comprends que les paris
              sportifs comportent des risques et j&apos;accepte les CGU.
            </Text>
          </Pressable>

          {error ? (
            <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
          ) : null}

          <BrandedButton
            label="Créer mon compte"
            loadingLabel="Création…"
            loading={loading}
            onPress={onSubmit}
          />

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: c.textMuted }]}>
              Déjà inscrit ?{' '}
              <Link
                href="/(auth)/sign-in"
                style={[styles.footerLink, { color: c.text }]}>
                Se connecter
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
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  error: { fontSize: 14 },
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
