import { Image, Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ImageBackground } from 'react-native';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { ComboBetDetail } from '@/components/combo-bet-detail';
import { ConfidenceDots } from '@/components/confidence-dots';
import { FormPills } from '@/components/form-pills';
import { MarkAsPlayedSheet } from '@/components/mark-as-played-sheet';
import { StatsCenterSheet } from '@/components/stats-center-sheet';
import { TennisScoreBoard } from '@/components/tennis-score-board';
import { useTeamStatsEnrichment } from '@/lib/use-team-stats-enrichment';
import { useStatSummary } from '@/lib/use-stat-summary';
import { StatSummaryBlock } from '@/components/stat-summary-block';
import { displayTeamName } from '@/lib/team-display-names';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import {
  getCompetitionColor,
  getCompetitionFlag,
  getSportSymbol,
  SPORT_COLOR,
} from '@/lib/competition-meta';
import { useAllBets } from '@/lib/use-all-bets';
import { formatHour, formatLongDate } from '@/lib/format-date';
import { useProfile } from '@/lib/use-profile';
import { useUserBets } from '@/lib/use-user-bets';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { AnyBet, Prono } from '@/types/prono';

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
  const { isLoading, canAccess } = useProfile();
  const { playedBetIds, unmarkBet } = useUserBets();
  const { bets: ALL_BETS, isLoading: betsLoading } = useAllBets();
  const [statsOpen, setStatsOpen] = useState(false);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  const [markedBet, setMarkedBet] = useState<AnyBet | null>(null);
  // Ratio dynamique du ticket bookmaker (détecté à onLoad de l'image)
  const [ticketRatio, setTicketRatio] = useState<number | null>(null);

  const bet = ALL_BETS.find((b) => b.id === id);

  // ⚠️ Tous les hooks DOIVENT être appelés ici, AVANT les early returns,
  // sinon React crash "Rendered more hooks than during the previous
  // render" (le compteur de hooks doit être stable entre renders).
  // Pour les combos, on passe sport=undefined → le hook no-op.
  const singleBet = bet && bet.type === 'single' ? bet : null;
  const enrichment = useTeamStatsEnrichment(
    singleBet?.competition,
    singleBet?.teamHome,
    singleBet?.teamAway,
    singleBet?.sport,
  );
  // Résumé statistique factuel auto-généré (foot uniquement)
  const statSummary = useStatSummary(
    singleBet?.sport,
    singleBet?.competition,
    singleBet?.teamHome,
    singleBet?.teamAway,
    singleBet?.result,
    singleBet?.finalScore,
    singleBet?.prediction,
  );

  function openMarkSheet(b: AnyBet) {
    setMarkedBet(b);
    setMarkSheetOpen(true);
  }
  async function onUnmark(betId: string) {
    await unmarkBet(betId);
  }

  // Pendant que les bets se chargent (1er fetch ou re-fetch realtime),
  // on n'affiche PAS "n'existe plus" : ça flash 1s puis bascule sur la
  // vraie fiche dès que ALL_BETS est rempli. → écran neutre.
  if (!bet && betsLoading) {
    return <View style={[styles.screen, { backgroundColor: c.bg }]} />;
  }

  if (!bet) {
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

  const hasAccess = canAccess(bet.minTier);

  // ===== ROUTING : combiné OU simple =====
  if (bet.type === 'combo') {
    if (!hasAccess) {
      return (
        <LockedView
          minTier={bet.minTier}
          onBack={() => router.back()}
          label="Ce combiné et son analyse complète sont réservés aux abonnés"
        />
      );
    }
    return <ComboBetDetail combo={bet} onBack={() => router.back()} />;
  }

  // bet.type === 'single' à partir d'ici
  const rawProno = bet;

  // Auto-enrichissement : pour les paris foot publiés à la main par Julien
  // sans MatchPicker, on lookup team_stats pour récupérer position, forme
  // et logo des 2 équipes (le hook est appelé tout en haut du composant).
  const prono = {
    ...rawProno,
    teamHomeLogo: rawProno.teamHomeLogo ?? enrichment.homeLogo,
    teamAwayLogo: rawProno.teamAwayLogo ?? enrichment.awayLogo,
    teamHomeForm: rawProno.teamHomeForm ?? enrichment.teamHomeForm,
    teamAwayForm: rawProno.teamAwayForm ?? enrichment.teamAwayForm,
  };
  // Positions live extraites de team_stats (overrident prono.stats si présentes).
  const homePos = enrichment.homePosition ?? prono.stats?.homePosition;
  const awayPos = enrichment.awayPosition ?? prono.stats?.awayPosition;

  if (!hasAccess) {
    return (
      <LockedView
        minTier={prono.minTier}
        onBack={() => router.back()}
        label="Ce pronostic et son analyse complète sont réservés aux abonnés"
      />
    );
  }

  const resultTint =
    prono.result === 'win' || prono.result === 'loss' || prono.result === 'void'
      ? RESULT_TINT[prono.result]
      : null;
  const isResolved = resultTint !== null;

  const competitionColor = getCompetitionColor(prono.competition);
  const flagUrl = getCompetitionFlag(prono.competition);
  const sportSymbol = getSportSymbol(prono.sport);

  // Bg de la card hero : image stade adaptée au sport (foot ou tennis).
  const heroBg =
    prono.sport === 'foot'
      ? require('@/assets/images/bg-detail-foot.png')
      : prono.sport === 'tennis'
        ? require('@/assets/images/bg-detail-tennis.png')
        : null;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* BG page : rayures dorées (même image que Stats/Carnet) */}
      <ExpoImage
        source={require('@/assets/images/bg-stats.png')}
        style={styles.pageBgImage}
        contentFit="cover"
      />
      <View style={styles.pageBgOverlay} pointerEvents="none" />

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
            {/* BG image stade (uniquement foot pour l'instant) */}
            {heroBg ? (
              <>
                <ExpoImage
                  source={heroBg}
                  style={styles.heroBgImage}
                  contentFit="cover"
                />
                <View style={styles.heroBgOverlay} pointerEvents="none" />
              </>
            ) : null}
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
                  {displayTeamName(prono.teamHome)}
                </Text>
                {prono.teamHomeForm || homePos !== undefined ? (
                  <View style={styles.teamMeta}>
                    {prono.teamHomeForm ? (
                      <FormPills form={prono.teamHomeForm} size={13} />
                    ) : null}
                    {homePos !== undefined ? (
                      <View
                        style={[styles.posBadge, { borderColor: c.borderSoft }]}>
                        <Text style={[styles.posBadgeText, { color: c.text }]}>
                          #{homePos}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.middleCol}>
                {isResolved && prono.finalScore ? (
                  <>
                    <Text style={[styles.heroDate, { color: c.textDim }]}>
                      {formatLongDate(prono.matchStartAt)}
                    </Text>
                    {/* Pour le tennis, on n'affiche PAS le score ici :
                        le TennisScoreBoard en bas le montre déjà en détail
                        avec les sets + tiebreaks. Doublon visuel évité. */}
                    {prono.sport !== 'tennis' ? (
                      <Text style={[styles.score, { color: c.text }]}>
                        {prono.finalScore.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()}
                      </Text>
                    ) : null}
                    <Text
                      style={[
                        styles.heroResult,
                        {
                          color:
                            prono.result === 'win'
                              ? c.success
                              : prono.result === 'loss'
                                ? c.danger
                                : c.textMuted,
                        },
                      ]}>
                      {prono.result === 'win'
                        ? '✓ GAGNÉ'
                        : prono.result === 'loss'
                          ? '✗ PERDU'
                          : '— ANNULÉ'}
                    </Text>
                  </>
                ) : isResolved ? (
                  // Pari résolu sans score renseigné : on remplace l'heure
                  // (qui n'a aucun sens, le match est passé) par un badge
                  // de résultat cohérent avec le bandeau du haut.
                  <>
                    <Text style={[styles.heroDate, { color: c.textDim }]}>
                      {formatLongDate(prono.matchStartAt)}
                    </Text>
                    <Text
                      style={[
                        styles.heroResult,
                        {
                          color:
                            prono.result === 'win'
                              ? c.success
                              : prono.result === 'loss'
                                ? c.danger
                                : c.textMuted,
                        },
                      ]}>
                      {prono.result === 'win'
                        ? '✓ GAGNÉ'
                        : prono.result === 'loss'
                          ? '✗ PERDU'
                          : '— ANNULÉ'}
                    </Text>
                  </>
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
                  {displayTeamName(prono.teamAway)}
                </Text>
                {prono.teamAwayForm || awayPos !== undefined ? (
                  <View style={styles.teamMeta}>
                    {prono.teamAwayForm ? (
                      <FormPills form={prono.teamAwayForm} size={13} />
                    ) : null}
                    {awayPos !== undefined ? (
                      <View
                        style={[styles.posBadge, { borderColor: c.borderSoft }]}>
                        <Text style={[styles.posBadgeText, { color: c.text }]}>
                          #{awayPos}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            {isResolved && prono.finalScore ? (
              prono.sport === 'tennis' ? (
                <View
                  style={[styles.tennisBoardWrap, { backgroundColor: c.bgDeeper }]}>
                  <TennisScoreBoard
                    home={{ name: displayTeamName(prono.teamHome) }}
                    away={{ name: displayTeamName(prono.teamAway) }}
                    score={prono.finalScore}
                  />
                </View>
              ) : (
                <View
                  style={[styles.scoreLine, { backgroundColor: c.bgDeeper }]}>
                  <Text style={[styles.scoreLineText, { color: c.text }]}>
                    Score final · {prono.finalScore.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()}
                  </Text>
                </View>
              )
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
              {
                backgroundColor: c.bgElevated,
                borderColor: c.gold,
                shadowColor: c.gold,
              },
            ]}>
            <Text style={[styles.predictionText, { color: c.text }]}>
              {prono.prediction}
            </Text>
            <View style={styles.predictionMeta}>
              <View
                style={[
                  styles.oddPill,
                  {
                    backgroundColor: c.bgElevated,
                    borderColor: c.gold,
                    borderWidth: 1.2,
                  },
                ]}>
                <Text style={[styles.oddPillLabel, { color: c.gold }]}>
                  COTE
                </Text>
                <Text style={[styles.oddPillValue, { color: c.gold }]}>
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

        {/* ============ RÉSUMÉ STATISTIQUE (factuel, auto) ============
            S'affiche uniquement si on a des stats suffisantes en DB.
            Label "RÉSUMÉ STATISTIQUE" pour ne JAMAIS être confondu avec
            l'analyse de Julien (transparence éthique). */}
        {statSummary.text ? (
          <Section title="STATS DU MATCH">
            <StatSummaryBlock text={statSummary.text} />
          </Section>
        ) : null}

        {/* ============ TICKET DU BOOKMAKER (preuve réelle) ============ */}
        {prono.bookmakerScreenshotUrl ? (
          <Section
            title={
              prono.bookmakerName
                ? `TICKET RÉEL · ${prono.bookmakerName.toUpperCase()}`
                : 'TICKET RÉEL DE JULIEN'
            }>
            <Text style={[styles.ticketIntro, { color: c.textMuted }]}>
              Pari réellement posé sur le compte bookmaker de Julien — preuve
              que la mise est engagée.
            </Text>
            <View
              style={[
                styles.ticketBox,
                { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
              ]}>
              <Image
                source={{ uri: prono.bookmakerScreenshotUrl }}
                style={[
                  styles.ticketImage,
                  ticketRatio != null ? { aspectRatio: ticketRatio } : null,
                ]}
                contentFit="contain"
                onLoad={(e) => {
                  const w = e?.source?.width;
                  const h = e?.source?.height;
                  if (w && h) setTicketRatio(w / h);
                }}
              />
            </View>
          </Section>
        ) : null}

        {/* ============ CTA carnet personnel ============ */}
        <View style={styles.ctaBlock}>
          {playedBetIds.has(prono.id) ? (
            <>
              <BrandedButton
                label="✓ Ajouté à ton carnet"
                variant="ghost"
                onPress={() => onUnmark(prono.id)}
              />
              <Text style={[styles.ctaHint, { color: c.textDim }]}>
                Tape de nouveau pour retirer ce pari de ton carnet.
              </Text>
            </>
          ) : (
            <>
              <BrandedButton
                label="J’ai joué ce pari"
                variant="gold"
                onPress={() => openMarkSheet(prono)}
              />
              <Text style={[styles.ctaHint, { color: c.textDim }]}>
                Ajoute ce pari à ton carnet personnel pour suivre ton ROI réel.
                Tu pourras renseigner ta mise (optionnel).
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <StatsCenterSheet
        visible={statsOpen}
        prono={prono}
        onClose={() => setStatsOpen(false)}
      />

      <MarkAsPlayedSheet
        visible={markSheetOpen}
        bet={markedBet}
        onClose={() => setMarkSheetOpen(false)}
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
  minTier,
  onBack,
  label,
}: {
  minTier: Prono['minTier'];
  onBack: () => void;
  label: string;
}) {
  const c = useThemeColors();
  const router = useRouter();
  const tierLabel = minTier.toUpperCase();

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
          {label} {tierLabel}. Choisis le pack qui te correspond pour y accéder.
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
  // BG page (rayures dorées) — couvre tout l'écran derrière le contenu.
  pageBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pageBgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  // BG card hero (stade doré) — occupe toute la card derrière le contenu.
  heroBgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroBgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
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
  heroResult: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
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
  tennisBoardWrap: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
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
    borderWidth: 1.5,
    gap: Spacing.three,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
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
    paddingVertical: 8,
    borderRadius: 10,
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
  // === Ticket bookmaker ===
  ticketIntro: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: Spacing.two,
    fontStyle: 'italic',
  },
  ticketBox: {
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  ticketImage: {
    width: '100%',
    aspectRatio: 9 / 16, // par défaut avant onLoad, écrasé dynamiquement
    maxHeight: 560,
    borderRadius: Radius.sm,
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
