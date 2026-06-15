import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { ConfidenceDots } from '@/components/confidence-dots';
import { MarkAsPlayedSheet } from '@/components/mark-as-played-sheet';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { formatHour, formatLongDate } from '@/lib/format-date';
import { displayTeamName } from '@/lib/team-display-names';
import { useThemeColors } from '@/lib/use-theme-colors';
import { useUserBets } from '@/lib/use-user-bets';
import type {
  ComboBet,
  ComboBetSelection,
  Prono,
  PronoResult,
} from '@/types/prono';

import { StatsCenterSheet } from './stats-center-sheet';
import { TennisScoreBoard } from './tennis-score-board';

const COLOR_WIN = '#10B981';
const COLOR_LOSS = '#EF4444';
const COLOR_LIVE = '#F59E0B';
const COLOR_VOID = '#A8A29E';

const RESULT_TINT = {
  win: { bg: '#ECFDF5', accent: COLOR_WIN, label: 'COMBINÉ GAGNÉ' },
  loss: { bg: '#FEF2F2', accent: COLOR_LOSS, label: 'COMBINÉ PERDU' },
  void: { bg: '#F5F5F4', accent: COLOR_VOID, label: 'COMBINÉ ANNULÉ' },
} as const;

/** BG image pour les cards sélection résolues (gagné/perdu), selon sport. */
function getSelectionBg(
  sport: ComboBetSelection['sport'],
  result: 'win' | 'loss',
) {
  if (sport === 'tennis') {
    return result === 'win'
      ? require('@/assets/images/bg-card-won-tennis.png')
      : require('@/assets/images/bg-card-lost-tennis.png');
  }
  return result === 'win'
    ? require('@/assets/images/bg-card-won.png')
    : require('@/assets/images/bg-card-lost.png');
}

export function ComboBetDetail({
  combo,
  onBack,
}: {
  combo: ComboBet;
  onBack: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [statsForSelection, setStatsForSelection] =
    useState<ComboBetSelection | null>(null);
  const [markSheetOpen, setMarkSheetOpen] = useState(false);
  // Ratio dynamique du ticket bookmaker (détecté à onLoad de l'image)
  const [ticketRatio, setTicketRatio] = useState<number | null>(null);
  const { playedBetIds, unmarkBet } = useUserBets();
  const alreadyPlayed = playedBetIds.has(combo.id);

  const resultTint =
    combo.result === 'win' || combo.result === 'loss' || combo.result === 'void'
      ? RESULT_TINT[combo.result]
      : null;

  // Bg de la card hero : image stade selon le sport du combo.
  // 100% foot → stade foot · 100% tennis → court tennis · mixte → terrain mixte.
  const heroBg = (() => {
    const sportsSet = new Set(combo.selections.map((s) => s.sport));
    if (sportsSet.size === 1) {
      if (sportsSet.has('foot'))
        return require('@/assets/images/bg-detail-foot.png');
      if (sportsSet.has('tennis'))
        return require('@/assets/images/bg-detail-tennis.png');
    }
    // Mixte (foot + tennis) → image terrain mixte doré.
    return require('@/assets/images/bg-detail-combo.png');
  })();

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* BG page : rayures dorées (même image que Stats/Carnet/Fiche détail) */}
      <ExpoImage
        source={require('@/assets/images/bg-stats.png')}
        style={styles.pageBgImage}
        contentFit="cover"
      />
      <View style={styles.pageBgOverlay} pointerEvents="none" />

      <BackHeader onBack={onBack} />

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
            { backgroundColor: c.goldDecorative, shadowColor: '#0A0A0A' },
          ]}>
          <View style={[styles.hero, { backgroundColor: c.bgElevated }]}>
            {/* BG image stade selon sport du combo (foot ou tennis only) */}
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
                  name={combo.result === 'win' ? 'checkmark' : 'xmark'}
                  size={12}
                  tintColor="#FFFFFF"
                  weight="bold"
                />
                <Text style={styles.resultBannerText}>{resultTint.label}</Text>
              </View>
            ) : null}

            <View style={[styles.heroBody, resultTint && { paddingTop: 30 }]}>
              <Text style={[styles.heroEyebrow, { color: c.gold }]}>
                — COMBINÉ · {combo.selections.length} SÉLECTIONS
              </Text>

              <View style={styles.oddBlock}>
                <Text style={[styles.oddLabel, { color: c.textDim }]}>
                  COTE TOTALE
                </Text>
                <Text style={[styles.oddValue, { color: c.text }]}>
                  {combo.combinationOdd.toFixed(2)}
                </Text>
              </View>

              <View style={styles.confidenceRow}>
                <Text style={[styles.confidenceLabel, { color: c.textMuted }]}>
                  Indice de confiance
                </Text>
                <ConfidenceDots value={combo.confidence} showLabel={false} />
              </View>
            </View>
          </View>
        </View>

        {/* ============ ANALYSE GLOBALE ============ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.gold }]}>
            NOTRE ANALYSE
          </Text>
          <Text style={[styles.reasoning, { color: c.text }]}>
            {combo.reasoning}
          </Text>
        </View>

        {/* ============ SÉLECTIONS ============ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.gold }]}>
            LES {combo.selections.length} SÉLECTIONS
          </Text>
          <View style={{ gap: Spacing.three }}>
            {combo.selections.map((sel, i) => (
              <SelectionCard
                key={i}
                selection={sel}
                index={i + 1}
                onOpenStats={() => setStatsForSelection(sel)}
              />
            ))}
          </View>
        </View>

        {/* ============ TICKET DU BOOKMAKER (preuve réelle) ============ */}
        {combo.bookmakerScreenshotUrl ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.gold }]}>
              {combo.bookmakerName
                ? `TICKET RÉEL · ${combo.bookmakerName.toUpperCase()}`
                : 'TICKET RÉEL DE JULIEN'}
            </Text>
            <Text style={[styles.ticketIntro, { color: c.textMuted }]}>
              Pari réellement posé sur le compte bookmaker de Julien — preuve
              que la mise est engagée.
            </Text>
            <View
              style={[
                styles.ticketBox,
                { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
              ]}>
              <ExpoImage
                source={{ uri: combo.bookmakerScreenshotUrl }}
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
          </View>
        ) : null}

        {/* ============ CTA carnet personnel ============ */}
        <View style={styles.ctaBlock}>
          {alreadyPlayed ? (
            <>
              <BrandedButton
                label="✓ Ajouté à ton carnet"
                variant="ghost"
                onPress={() => unmarkBet(combo.id)}
              />
              <Text style={[styles.ctaHint, { color: c.textDim }]}>
                Tape de nouveau pour retirer ce combiné de ton carnet.
              </Text>
            </>
          ) : (
            <>
              <BrandedButton
                label="J’ai joué ce combiné"
                variant="gold"
                onPress={() => setMarkSheetOpen(true)}
              />
              <Text style={[styles.ctaHint, { color: c.textDim }]}>
                Ajoute ce combiné à ton carnet personnel pour suivre ton ROI réel.
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Stats Center pour la sélection sélectionnée */}
      <StatsCenterSheet
        visible={statsForSelection !== null}
        prono={statsForSelection ? selectionToProno(statsForSelection) : null}
        onClose={() => setStatsForSelection(null)}
      />

      <MarkAsPlayedSheet
        visible={markSheetOpen}
        bet={combo}
        onClose={() => setMarkSheetOpen(false)}
      />
    </View>
  );
}

/**
 * Adapte une ComboBetSelection au format Prono attendu par StatsCenterSheet.
 * On crée un Prono synthétique pour réutiliser la sheet existante.
 */
function selectionToProno(sel: ComboBetSelection): Prono {
  return {
    type: 'single',
    id: `combo-sel-${sel.matchStartAt}-${sel.teamHome}`,
    sport: sel.sport,
    competition: sel.competition,
    matchApiFixtureId: sel.matchApiFixtureId,
    teamHome: sel.teamHome,
    teamAway: sel.teamAway,
    teamHomeLogo: sel.teamHomeLogo,
    teamAwayLogo: sel.teamAwayLogo,
    matchStartAt: sel.matchStartAt,
    prediction: sel.prediction,
    odd: sel.odd,
    confidence: 3,
    reasoning: sel.miniReasoning,
    minTier: 'starter',
    publishedAt: sel.matchStartAt,
    result: sel.result,
    finalScore: sel.finalScore,
    stats: sel.stats,
    tennisStats: sel.tennisStats,
  };
}

// =============================================================================
// Sélection en card individuelle (dans la fiche détaillée)
// =============================================================================
function SelectionCard({
  selection,
  index,
  onOpenStats,
}: {
  selection: ComboBetSelection;
  index: number;
  onOpenStats: () => void;
}) {
  const c = useThemeColors();
  const resolved =
    selection.result === 'win' ||
    selection.result === 'loss' ||
    selection.result === 'void';
  // BG image uniquement pour win/loss (pas pour void qui reste sobre).
  const bgImage =
    selection.result === 'win' || selection.result === 'loss'
      ? getSelectionBg(selection.sport, selection.result)
      : null;
  const borderColor =
    selection.result === 'win'
      ? COLOR_WIN
      : selection.result === 'loss'
        ? COLOR_LOSS
        : c.borderFaint;

  if (bgImage) {
    return (
      <ImageBackground
        source={bgImage}
        style={[
          styles.selCard,
          { borderColor, borderWidth: 1.5, overflow: 'hidden' },
        ]}
        imageStyle={styles.selCardBgImg}>
        <View style={styles.selCardOverlay} pointerEvents="none" />
        <SelectionCardContent
          selection={selection}
          index={index}
          onOpenStats={onOpenStats}
          resolved={resolved}
        />
      </ImageBackground>
    );
  }

  const isVoid = selection.result === 'void';
  return (
    <View
      style={[
        styles.selCard,
        {
          backgroundColor: c.bgElevated,
          borderColor,
          borderWidth: resolved ? 1.5 : StyleSheet.hairlineWidth,
          opacity: isVoid ? 0.65 : 1,
          overflow: 'hidden',
          position: 'relative',
        },
      ]}>
      <SelectionCardContent
        selection={selection}
        index={index}
        onOpenStats={onOpenStats}
        resolved={resolved}
      />
      {isVoid ? (
        <View style={styles.voidStamp} pointerEvents="none">
          <Text
            style={[
              styles.voidStampText,
              { color: c.danger, borderColor: c.danger },
            ]}>
            ANNULÉ
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function SelectionCardContent({
  selection,
  index,
  onOpenStats,
  resolved,
}: {
  selection: ComboBetSelection;
  index: number;
  onOpenStats: () => void;
  resolved: boolean;
}) {
  const c = useThemeColors();
  return (
    <>
      <View style={styles.selHeader}>
        <View style={styles.selHeaderLeft}>
          <Text style={[styles.selIndex, { color: c.textDim }]}>{index}</Text>
          {selection.sport === 'tennis' ? (
            <View style={styles.tennisBg}>
              <SymbolView
                name="tennisball"
                size={12}
                tintColor="#D4FF00"
                weight="bold"
              />
            </View>
          ) : (
            <SymbolView
              name="soccerball"
              size={16}
              type="multicolor"
              weight="bold"
            />
          )}
          <Text
            style={[styles.selCompetition, { color: c.textMuted }]}
            numberOfLines={1}>
            {selection.competition}
          </Text>
        </View>
        <SelectionStatusBadge result={selection.result} />
      </View>

      <View style={styles.selTeams}>
        <Text style={[styles.selTeamName, { color: c.text }]} numberOfLines={1}>
          {displayTeamName(selection.teamHome)}
        </Text>
        <View style={[styles.vsPill, { backgroundColor: c.bgDeeper }]}>
          <Text style={[styles.vsText, { color: c.textMuted }]}>VS</Text>
        </View>
        <Text
          style={[
            styles.selTeamName,
            { color: c.text, textAlign: 'right' },
          ]}
          numberOfLines={1}>
          {displayTeamName(selection.teamAway)}
        </Text>
      </View>

      {resolved && selection.finalScore && selection.sport === 'tennis' ? (
        <View style={styles.selTennisBoardWrap}>
          <TennisScoreBoard
            home={{ name: displayTeamName(selection.teamHome) }}
            away={{ name: displayTeamName(selection.teamAway) }}
            score={selection.finalScore}
          />
        </View>
      ) : (
        <Text style={[styles.selTime, { color: c.textDim }]}>
          {resolved && selection.finalScore
            ? `Score · ${selection.finalScore}`
            : `${formatLongDate(selection.matchStartAt)} · ${formatHour(selection.matchStartAt)}`}
        </Text>
      )}

      <View
        style={[styles.selDivider, { backgroundColor: c.borderFaint }]}
      />

      <View style={styles.selPronoRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.selPronoLabel, { color: c.gold }]}>
            NOTRE PRONO
          </Text>
          <Text style={[styles.selPredictionText, { color: c.text }]}>
            {selection.prediction}
          </Text>
        </View>
        <View
          style={[
            styles.selOddBlock,
            { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
          ]}>
          <Text style={[styles.selOddLabel, { color: c.textDim }]}>COTE</Text>
          <Text style={[styles.selOddValue, { color: c.text }]}>
            {selection.odd.toFixed(2)}
          </Text>
        </View>
      </View>

      <Text style={[styles.selMiniReasoning, { color: c.textMuted }]}>
        {selection.miniReasoning}
      </Text>

      <Pressable
        onPress={onOpenStats}
        style={({ pressed }) => [
          styles.statsBtn,
          {
            backgroundColor: c.bgDeeper,
            borderColor: c.borderSoft,
            opacity: pressed ? 0.6 : 1,
          },
        ]}>
        <SymbolView
          name="chart.bar"
          size={14}
          tintColor={c.gold}
          weight="semibold"
        />
        <Text style={[styles.statsBtnText, { color: c.text }]}>
          Voir les statistiques du match
        </Text>
        <SymbolView
          name="arrow.up.right"
          size={11}
          tintColor={c.textMuted}
          weight="semibold"
        />
      </Pressable>
    </>
  );
}

function SelectionStatusBadge({ result }: { result: PronoResult }) {
  if (result === 'win') {
    return (
      <View style={[styles.statusBadge, { backgroundColor: COLOR_WIN }]}>
        <SymbolView name="checkmark" size={10} tintColor="#FFFFFF" weight="bold" />
        <Text style={styles.statusBadgeText}>Gagné</Text>
      </View>
    );
  }
  if (result === 'loss') {
    return (
      <View style={[styles.statusBadge, { backgroundColor: COLOR_LOSS }]}>
        <SymbolView name="xmark" size={10} tintColor="#FFFFFF" weight="bold" />
        <Text style={styles.statusBadgeText}>Perdu</Text>
      </View>
    );
  }
  if (result === 'live') {
    return (
      <View style={[styles.statusBadge, { backgroundColor: COLOR_LIVE }]}>
        <View style={styles.livePulseMini} />
        <Text style={styles.statusBadgeText}>Live</Text>
      </View>
    );
  }
  return null;
}

// =============================================================================
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

const styles = StyleSheet.create({
  screen: { flex: 1 },
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
  selCardBgImg: {
    borderRadius: 14,
    resizeMode: 'cover',
  },
  selCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
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
  // Hero
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
    overflow: 'hidden',
    position: 'relative',
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
  heroBody: {
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  oddBlock: {
    alignItems: 'center',
    gap: 2,
  },
  oddLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  oddValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Sections
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
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
    aspectRatio: 9 / 16,
    maxHeight: 560,
    borderRadius: Radius.sm,
  },
  // Selection card
  selCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    gap: Spacing.two,
  },
  voidStamp: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-12deg' }],
  },
  voidStampText: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 8,
    opacity: 0.55,
    borderWidth: 4,
    paddingHorizontal: 20,
    paddingVertical: 4,
    fontStyle: 'italic',
  },
  selHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  selHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  selIndex: {
    fontSize: 11,
    fontWeight: '800',
    width: 14,
    textAlign: 'center',
  },
  tennisBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selCompetition: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  livePulseMini: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  selTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  selTeamName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flex: 1,
  },
  vsPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  selTime: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: -2,
  },
  selDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
  },
  selTennisBoardWrap: {
    marginTop: 4,
    marginBottom: 4,
  },
  selPronoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  selPronoLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  selPredictionText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  selOddBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 64,
  },
  selOddLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  selOddValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  selMiniReasoning: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
  },
  statsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  statsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
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
});
