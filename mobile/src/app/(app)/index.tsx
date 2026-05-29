import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
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
import { PronoCard } from '@/components/prono-card';
import { StatsBilanRow } from '@/components/stats-bilan-row';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { computeBilan, getGreeting } from '@/lib/bilan';
import { PRONOS_FIXTURES } from '@/lib/fixtures';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { TIER_LEVEL } from '@/types/profile';
import type { Prono } from '@/types/prono';

export default function HomeScreen() {
  const c = useThemeColors();
  const { session } = useAuth();
  const { profile, isTrialActive, trialDaysLeft, startTrial, isLoading } =
    useProfile();
  const router = useRouter();

  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  // Greeting recalculé chaque minute (passage matin → midi → soir).
  // Pattern "tick périodique" → setState légitime dans l'effet.
  const [greeting, setGreeting] = useState('Bonjour');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting());
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  const shouldShowTrialBanner = !isLoading && profile && profile.tier === null;

  // Bilan AJ Pronos sur 7 derniers jours
  const bilan = useMemo(() => computeBilan(PRONOS_FIXTURES, 7), []);

  // Pronos du jour (limités aux 3 premiers, triés par heure)
  const todayPronos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = today.getTime() + 86_400_000;
    return PRONOS_FIXTURES.filter((p) => {
      const t = new Date(p.matchStartAt).getTime();
      return t >= today.getTime() && t < tomorrow;
    })
      .sort(
        (a, b) =>
          new Date(a.matchStartAt).getTime() -
          new Date(b.matchStartAt).getTime(),
      )
      .slice(0, 3);
  }, []);

  function hasAccess(prono: Prono): boolean {
    if (!profile?.tier) return false;
    if (isTrialActive) return true;
    if (profile.tier === 'trial') return false;
    return TIER_LEVEL[profile.tier] >= TIER_LEVEL[prono.minTier];
  }

  function openPronoDetail(prono: Prono) {
    router.push({
      pathname: '/(app)/pronos/[id]',
      params: { id: prono.id },
    });
  }

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

  const userFirstName = session?.user.email?.split('@')[0]?.split('.')[0] ?? '';
  const userDisplay =
    userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BrandHeader />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Salutation */}
        <View style={styles.greetingBlock}>
          <Text style={[styles.greeting, { color: c.text }]}>
            {greeting}
            {userDisplay ? `, ${userDisplay}.` : '.'}
          </Text>
          {isTrialActive ? (
            <View
              style={[
                styles.trialChip,
                { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
              ]}>
              <View style={[styles.trialChipDot, { backgroundColor: c.gold }]} />
              <Text style={[styles.trialChipText, { color: c.text }]}>
                Essai · J-{trialDaysLeft}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bannière trial gratuit (si pas encore démarré) */}
        {shouldShowTrialBanner ? (
          <Pressable
            onPress={() => setTrialModalOpen(true)}
            style={[
              styles.trialBanner,
              { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
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

        {/* Section bilan AJ Pronos (nos stats) */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionEyebrow, { color: c.gold }]}>
              — NOTRE BILAN · 7 JOURS
            </Text>
            <Text style={[styles.sectionHint, { color: c.textDim }]}>
              {bilan.total} prono{bilan.total > 1 ? 's' : ''}
            </Text>
          </View>
          <StatsBilanRow bilan={bilan} />
          <Text style={[styles.bilanFootnote, { color: c.textDim }]}>
            Sur les 7 derniers jours. Performance passée, ne préjuge pas du futur.
          </Text>
        </View>

        {/* Section TON BILAN (placeholder Phase 2 — carnet personnel) */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionEyebrow, { color: c.gold }]}>
              — TON BILAN
            </Text>
            <Text style={[styles.sectionHint, { color: c.textDim }]}>
              bientôt
            </Text>
          </View>
          <View
            style={[
              styles.personalEmpty,
              {
                backgroundColor: c.bgDeeper,
                borderColor: c.borderFaint,
              },
            ]}>
            <Text style={[styles.personalEmptyTitle, { color: c.text }]}>
              Tes stats personnelles arrivent bientôt.
            </Text>
            <Text style={[styles.personalEmptyBody, { color: c.textMuted }]}>
              Tu pourras marquer chaque prono que tu as joué, suivre tes propres
              gains/pertes et ton ROI réel.
            </Text>
          </View>
        </View>

        {/* Section pronos du jour */}
        <View style={styles.section}>
          <View style={styles.sectionHeadRow}>
            <Text style={[styles.sectionEyebrow, { color: c.gold }]}>
              — AUJOURD’HUI
            </Text>
            <Pressable
              onPress={() => router.push('/(app)/pronos')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.seeAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.seeAllText, { color: c.text }]}>
                Voir tout
              </Text>
              <SymbolView
                name="arrow.right"
                size={12}
                tintColor={c.text}
                weight="semibold"
              />
            </Pressable>
          </View>

          {todayPronos.length === 0 ? (
            <View
              style={[
                styles.emptyToday,
                { backgroundColor: c.bgElevated, borderColor: c.borderFaint },
              ]}>
              <Text style={[styles.emptyTodayText, { color: c.textMuted }]}>
                Pas de prono publié aujourd’hui. Notre analyste valide les
                pronos en début de matinée — reviens plus tard.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.three }}>
              {todayPronos.map((p) => (
                <PronoCard
                  key={p.id}
                  prono={p}
                  hasAccess={hasAccess(p)}
                  onPress={() => openPronoDetail(p)}
                />
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.legalNote, { color: c.textDim }]}>
          +18 — les paris sportifs comportent des risques.
        </Text>
      </ScrollView>

      {/* Modal essai gratuit */}
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
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  greetingBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  trialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  trialChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trialChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
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
  section: {
    gap: Spacing.two,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  bilanFootnote: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  emptyToday: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  personalEmpty: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    gap: 6,
  },
  personalEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  personalEmptyBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  emptyTodayText: {
    fontSize: 13,
    lineHeight: 19,
  },
  legalNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.three,
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
