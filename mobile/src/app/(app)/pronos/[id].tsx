import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { ConfidenceDots } from '@/components/confidence-dots';
import { FormPills } from '@/components/form-pills';
import { StatsCenterSheet } from '@/components/stats-center-sheet';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import {
  getCompetitionColor,
  getCompetitionFlag,
  getSportSymbol,
  SPORT_COLOR,
} from '@/lib/competition-meta';
import { PRONOS_FIXTURES } from '@/lib/fixtures';
import { formatHour, formatLongDate } from '@/lib/format-date';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { TIER_LEVEL } from '@/types/profile';
import type { Prono } from '@/types/prono';

const RESULT_TINT = {
  win: { bg: '#ECFDF5', accent: '#10B981', label: 'PARI GAGNÉ' },
  loss: { bg: '#FEF2F2', accent: '#EF4444', label: 'PARI PERDU' },
  void: { bg: '#F5F5F4', accent: '#A8A29E', label: 'PARI ANNULÉ' },
} as const;

export default function PronoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isLoading, isTrialActive } = useProfile();
  const [statsOpen, setStatsOpen] = useState(false);

  const prono = PRONOS_FIXTURES.find((p) => p.id === id);

  if (!prono) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <BackHeader onBack={() => router.back()} />
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: c.textMuted }]}>
            Ce pronostic n’existe plus.
          </Text>
        </View>
      </View>
    );
  }

  // Pendant le chargement du profile, on évite de rendre LockedView par
  // défaut (sinon flash visuel). On rend juste le fond crème — le contenu
  // apparaîtra d'un coup quand le profile sera prêt.
  if (isLoading) {
    return <View style={[styles.screen, { backgroundColor: c.bg }]} />;
  }

  // Gating accès
  const hasAccess =
    !!profile?.tier &&
    (isTrialActive ||
      (profile.tier !== 'trial' &&
        TIER_LEVEL[profile.tier] >= TIER_LEVEL[prono.minTier]));

  if (!hasAccess) {
    return <LockedView prono={prono} onBack={() => router.back()} />;
  }

  const isResolved = prono.result !== 'pending';
  const resultTint =
    isResolved && prono.result !== 'pending' ? RESULT_TINT[prono.result] : null;

  const competitionColor = getCompetitionColor(prono.competition);
  const flagUrl = getCompetitionFlag(prono.competition);
  const sportSymbol = getSportSymbol(prono.sport);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BackHeader onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* ============ HERO ============ */}
        <View
          style={[
            styles.heroFrame,
            { backgroundColor: competitionColor, shadowColor: '#0A0A0A' },
          ]}>
          <View style={[styles.hero, { backgroundColor: c.bgElevated }]}>
            {resultTint ? (
              <View
                style={[
                  styles.resultBanner,
                  { backgroundColor: resultTint.accent },
                ]}>
                <SymbolView
                  name={prono.result === 'win' ? 'checkmark' : 'xmark'}
                  size={12}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
                <Text style={styles.resultBannerText}>{resultTint.label}</Text>
              </View>
            ) : null}

            <View style={styles.heroTop}>
              <View style={styles.heroTopLeft}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        prono.sport === 'foot' ? c.bgWarm : '#0A0A0A',
                    },
                  ]}>
                  <SymbolView
                    name={sportSymbol as never}
                    size={14}
                    {...(prono.sport === 'foot'
                      ? { type: 'multicolor' as const }
                      : { tintColor: SPORT_COLOR.tennis })}
                    weight="bold"
                  />
                </View>
                {flagUrl ? (
                  <View
                    style={[
                      styles.flagCircle,
                      {
                        borderColor: c.borderSoft,
                        backgroundColor: c.bgElevated,
                      },
                    ]}>
                    <Image
                      source={{ uri: flagUrl }}
                      style={styles.flagImg}
                      contentFit="cover"
                    />
                  </View>
                ) : null}
                <Text
                  style={[styles.competition, { color: c.textMuted }]}
                  numberOfLines={1}>
                  {prono.competition}
                </Text>
              </View>
            </View>

            <View style={styles.teamsRow}>
              <View style={styles.teamBlock}>
                <View style={[styles.logoWrap, { backgroundColor: c.bgDeeper }]}>
                  {prono.teamHomeLogo ? (
                    <Image
                      source={{ uri: prono.teamHomeLogo }}
                      style={styles.logoImg}
                      contentFit="contain"
                    />
                  ) : null}
                </View>
                <Text
                  style={[styles.teamNameBig, { color: c.text }]}
                  numberOfLines={2}>
                  {prono.teamHome}
                </Text>
                {prono.teamHomeForm ? (
                  <View style={styles.teamMeta}>
                    <FormPills form={prono.teamHomeForm} size={13} />
                    {prono.stats ? (
                      <View
                        style={[styles.posBadge, { borderColor: c.borderSoft }]}>
                        <Text style={[styles.posBadgeText, { color: c.text }]}>
                          #{prono.stats.homePosition}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.middleCol}>
                {isResolved && prono.finalScore ? (
                  <Text style={[styles.score, { color: c.text }]}>
                    {prono.finalScore.split(/\d.*\d/)[0]?.trim()}
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.heroDate, { color: c.textDim }]}>
                      {formatLongDate(prono.matchStartAt)}
                    </Text>
                    <Text style={[styles.heroHour, { color: c.text }]}>
                      {formatHour(prono.matchStartAt)}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.teamBlock}>
                <View style={[styles.logoWrap, { backgroundColor: c.bgDeeper }]}>
                  {prono.teamAwayLogo ? (
                    <Image
                      source={{ uri: prono.teamAwayLogo }}
                      style={styles.logoImg}
                      contentFit="contain"
                    />
                  ) : null}
                </View>
                <Text
                  style={[styles.teamNameBig, { color: c.text }]}
                  numberOfLines={2}>
                  {prono.teamAway}
                </Text>
                {prono.teamAwayForm ? (
                  <View style={styles.teamMeta}>
                    <FormPills form={prono.teamAwayForm} size={13} />
                    {prono.stats ? (
                      <View
                        style={[styles.posBadge, { borderColor: c.borderSoft }]}>
                        <Text style={[styles.posBadgeText, { color: c.text }]}>
                          #{prono.stats.awayPosition}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {isResolved && prono.finalScore ? (
              <View
                style={[styles.scoreLine, { backgroundColor: c.bgDeeper }]}>
                <Text style={[styles.scoreLineText, { color: c.text }]}>
                  Score final · {prono.finalScore}
                </Text>
              </View>
            ) : null}

            {/* Bouton stats center */}
            <Pressable
              onPress={() => setStatsOpen(true)}
              style={({ pressed }) => [
                styles.statsBtn,
                {
                  backgroundColor: c.bgDeeper,
                  borderColor: c.borderSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="chart.bar"
                size={16}
                tintColor={c.gold}
                weight="semibold"
              />
              <Text style={[styles.statsBtnText, { color: c.text }]}>
                Voir les statistiques détaillées
              </Text>
              <SymbolView
                name="arrow.up.right"
                size={12}
                tintColor={c.textMuted}
                weight="semibold"
              />
            </Pressable>
          </View>
        </View>

        {/* ============ NOTRE PRONO ============ */}
        <Section title="NOTRE PRONO">
          <View
            style={[
              styles.predictionCard,
              { backgroundColor: c.bgElevated, borderColor: c.borderFaint },
            ]}>
            <Text style={[styles.predictionText, { color: c.text }]}>
              {prono.prediction}
            </Text>
            <View style={styles.predictionMeta}>
              <View style={styles.oddPill}>
                <Text style={[styles.oddPillLabel, { color: c.textDim }]}>
                  COTE
                </Text>
                <Text style={[styles.oddPillValue, { color: c.text }]}>
                  {prono.odd.toFixed(2)}
                </Text>
              </View>
              <View style={styles.confidenceWrap}>
                <Text
                  style={[styles.confidenceLabel, { color: c.textMuted }]}>
                  Indice de confiance
                </Text>
                <ConfidenceDots value={prono.confidence} showLabel={false} />
              </View>
            </View>
          </View>
        </Section>

        {/* ============ NOTRE ANALYSE ============ */}
        <Section title="NOTRE ANALYSE">
          <Text style={[styles.reasoning, { color: c.text }]}>
            {prono.reasoning}
          </Text>
        </Section>

        {/* ============ CTA carnet personnel (P2) ============ */}
        <View style={styles.ctaBlock}>
          <BrandedButton
            label="Marquer comme joué"
            variant="ghost"
            onPress={() => {
              /* Phase 2 : carnet personnel */
            }}
            disabled
          />
          <Text style={[styles.ctaHint, { color: c.textDim }]}>
            Le carnet personnel arrive bientôt — tu pourras suivre ton historique de paris et ton ROI réel.
          </Text>
        </View>
      </ScrollView>

      <StatsCenterSheet
        visible={statsOpen}
        prono={prono}
        onClose={() => setStatsOpen(false)}
      />
    </View>
  );
}

function BackHeader({ onBack }: { onBack: () => void }) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.backHeader,
        {
          backgroundColor: c.bg,
          borderBottomColor: c.borderFaint,
          paddingTop: insets.top + 6,
        },
      ]}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
        <View style={styles.backRow}>
          <SymbolView
            name="chevron.left"
            size={20}
            tintColor={c.text}
            weight="semibold"
          />
          <Text style={[styles.backText, { color: c.text }]}>Pronos</Text>
        </View>
      </Pressable>
    </View>
  );
}

function LockedView({
  prono,
  onBack,
}: {
  prono: Prono;
  onBack: () => void;
}) {
  const c = useThemeColors();
  const router = useRouter();
  const tierLabel = prono.minTier.toUpperCase();

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BackHeader onBack={onBack} />
      <View style={styles.locked}>
        <SymbolView
          name="lock.fill"
          size={32}
          tintColor={c.gold}
          weight="semibold"
        />
        <Text style={[styles.lockedTitle, { color: c.text }]}>
          Pack {tierLabel} requis
        </Text>
        <Text style={[styles.lockedBody, { color: c.textMuted }]}>
          Ce pronostic et son analyse complète sont réservés aux abonnés{' '}
          {tierLabel}. Choisis le pack qui te correspond pour y accéder.
        </Text>
        <BrandedButton
          label="Voir les packs"
          onPress={() => router.replace('/(app)/subscribe')}
        />
      </View>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.gold }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  backHeader: {
    paddingHorizontal: Spacing.four,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: -4,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 14,
  },
  // === Hero ===
  heroFrame: {
    borderRadius: 18,
    padding: 3,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  hero: {
    borderRadius: 15,
    padding: Spacing.four,
    gap: Spacing.three,
    position: 'relative',
    overflow: 'hidden',
  },
  resultBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  resultBannerText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24, // place pour le bandeau résultat
  },
  heroTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  iconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagImg: {
    width: 22,
    height: 22,
  },
  competition: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  teamBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  logoImg: {
    width: 40,
    height: 40,
  },
  teamNameBig: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  middleCol: {
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroHour: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  score: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  scoreLine: {
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  scoreLineText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  teamMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  posBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
  },
  posBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  statsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    flex: 1,
    textAlign: 'center',
  },
  // === Sections ===
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  // === Prédiction ===
  predictionCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  predictionText: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  predictionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  oddPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F5F4ED',
  },
  oddPillLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  oddPillValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  confidenceWrap: {
    alignItems: 'flex-end',
    gap: 4,
    flex: 1,
  },
  confidenceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // === Analyse ===
  reasoning: {
    fontSize: 15,
    lineHeight: 23,
  },
  // === Stats ===
  statBlock: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  statBlockTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  formTeam: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  h2hRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  h2hCount: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  h2hValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  h2hLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  contextText: {
    fontSize: 14,
    lineHeight: 20,
  },
  absenceText: {
    fontSize: 13,
    lineHeight: 19,
  },
  // === CTA + locked ===
  ctaBlock: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  ctaHint: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.three,
  },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  lockedBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
