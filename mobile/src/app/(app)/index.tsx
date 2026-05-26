import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandedButton } from '@/components/branded-button';
import { BrandHeader } from '@/components/brand-header';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function HomeScreen() {
  const c = useThemeColors();
  const { session } = useAuth();
  const { profile, isTrialActive, trialDaysLeft, startTrial, isLoading } =
    useProfile();
  const router = useRouter();

  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  const shouldShowTrialBanner = !isLoading && profile && profile.tier === null;

  async function onStartTrial() {
    setTrialError(null);
    setStarting(true);
    const { error } = await startTrial();
    setStarting(false);
    if (error) {
      setTrialError(error);
      return;
    }
    setTrialModalOpen(false);
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BrandHeader />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {shouldShowTrialBanner ? (
          <Pressable
            onPress={() => setTrialModalOpen(true)}
            style={[
              styles.trialBanner,
              {
                backgroundColor: c.bgWarm,
                borderColor: c.goldDecorative,
              },
            ]}>
            <Text style={[styles.bannerEyebrow, { color: c.gold }]}>
              — 7 JOURS OFFERTS
            </Text>
            <Text style={[styles.bannerTitle, { color: c.text }]}>
              Démarre ton essai gratuit.
            </Text>
            <Text style={[styles.bannerBody, { color: c.textMuted }]}>
              Accès à tous les pronos pendant 7 jours. Sans engagement, aucune
              carte demandée.
            </Text>
            <Text style={[styles.bannerCta, { color: c.gold }]}>
              Démarrer →
            </Text>
          </Pressable>
        ) : null}

        {isTrialActive ? (
          <View
            style={[
              styles.trialActive,
              {
                backgroundColor: c.bgDeeper,
                borderColor: c.borderFaint,
              },
            ]}>
            <Text style={[styles.trialActiveLabel, { color: c.textMuted }]}>
              Essai en cours
            </Text>
            <Text style={[styles.trialActiveDays, { color: c.text }]}>
              J-{trialDaysLeft}
            </Text>
          </View>
        ) : null}

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
      </ScrollView>

      <Modal
        visible={trialModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTrialModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTrialModalOpen(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalEyebrow, { color: c.gold }]}>
              — ESSAI GRATUIT
            </Text>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              7 jours, sans CB.
            </Text>
            <Text style={[styles.modalBody, { color: c.textMuted }]}>
              On te donne accès à tous les pronos pendant 7 jours. À la fin de
              l’essai, tu choisis ton pack ou tu reviens en lecture limitée —
              aucune surprise, aucun débit automatique.
            </Text>

            {trialError ? (
              <Text style={[styles.error, { color: c.danger }]}>
                {trialError}
              </Text>
            ) : null}

            <View style={{ gap: Spacing.two }}>
              <BrandedButton
                label="Démarrer mes 7 jours"
                loadingLabel="Activation…"
                loading={starting}
                onPress={onStartTrial}
              />
              <BrandedButton
                label="Voir d’abord les packs"
                variant="ghost"
                onPress={() => {
                  setTrialModalOpen(false);
                  router.push('/(app)/subscribe');
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.four,
  },
  trialBanner: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  bannerEyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  bannerBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerCta: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  trialActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  trialActiveLabel: {
    fontSize: 13,
  },
  trialActiveDays: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
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
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    fontSize: 13,
  },
});
