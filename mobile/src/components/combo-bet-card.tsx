import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { displayTeamName } from '@/lib/team-display-names';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { ComboBet, ComboBetSelection, PronoResult } from '@/types/prono';

import { ConfidenceDots } from './confidence-dots';

const CONFIDENCE_LABEL: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'CONFIANCE FAIBLE',
  2: 'CONFIANCE MODÉRÉE',
  3: 'CONFIANCE CORRECTE',
  4: 'CONFIANCE ÉLEVÉE',
  5: 'CONFIANCE MAXIMALE',
};

/** Image bg pour combo gagné / perdu, selon la composition du combo :
 *  - 100% foot → ballon foot (vert/rouge)
 *  - 100% tennis → balle tennis (verte/rouge)
 *  - mixte foot + tennis → ballon foot + balle tennis (vert/rouge)
 *  Pour pending/live/void : pas d'image. */
function getComboBg(
  result: PronoResult,
  sports: ComboBetSelection['sport'][],
) {
  const set = new Set(sports);
  const onlyFoot = set.size === 1 && set.has('foot');
  const onlyTennis = set.size === 1 && set.has('tennis');
  if (result === 'win') {
    if (onlyFoot) return require('@/assets/images/bg-card-won.png');
    if (onlyTennis) return require('@/assets/images/bg-card-won-tennis.png');
    return require('@/assets/images/bg-card-won-combo.png');
  }
  if (result === 'loss') {
    if (onlyFoot) return require('@/assets/images/bg-card-lost.png');
    if (onlyTennis) return require('@/assets/images/bg-card-lost-tennis.png');
    return require('@/assets/images/bg-card-lost-combo.png');
  }
  // pending / live / void → bg "en cours" (doré stade)
  if (result === 'pending' || result === 'live') {
    if (onlyFoot) return require('@/assets/images/bg-card-pending-foot.png');
    if (onlyTennis)
      return require('@/assets/images/bg-card-pending-tennis.png');
    return require('@/assets/images/bg-card-pending-mixed.png');
  }
  return null;
}

// =============================================================================
// Couleurs résultat
// =============================================================================
const COLOR_WIN = '#10B981';
const COLOR_LOSS = '#EF4444';
const COLOR_LIVE = '#F59E0B';   // orange ambré pour LIVE
const COLOR_VOID = '#A8A29E';

// Style global de la card selon résultat global
const RESULT_STYLE = {
  win: {
    bg: 'rgba(16, 185, 129, 0.10)',
    border: '#10B981',
    chip: '#10B981',
    label: 'GAGNÉ',
  },
  loss: {
    bg: 'rgba(239, 68, 68, 0.10)',
    border: '#EF4444',
    chip: '#EF4444',
    label: 'PERDU',
  },
  void: {
    bg: 'rgba(168, 162, 158, 0.10)',
    border: '#A8A29E',
    chip: '#A8A29E',
    label: 'ANNULÉ',
  },
} as const;

type Props = {
  combo: ComboBet;
  hasAccess: boolean;
  onPress: () => void;
};

export function ComboBetCard({ combo, hasAccess, onPress }: Props) {
  const c = useThemeColors();
  // Toujours déplié par défaut (cohérent avec la maquette dark).
  const [expanded, setExpanded] = useState(true);

  const resultStyle =
    combo.result === 'win' || combo.result === 'loss' || combo.result === 'void'
      ? RESULT_STYLE[combo.result]
      : null;
  const isResolved = resultStyle !== null;

  // Compteurs V/D/void + nombre joués (badge "X/N joués").
  const counts = useMemo(() => {
    const wins = combo.selections.filter((s) => s.result === 'win').length;
    const losses = combo.selections.filter((s) => s.result === 'loss').length;
    const voids = combo.selections.filter((s) => s.result === 'void').length;
    const now = Date.now();
    const played = combo.selections.filter(
      (s) => new Date(s.matchStartAt).getTime() <= now,
    ).length;
    return {
      wins,
      losses,
      voids,
      played,
      total: combo.selections.length,
    };
  }, [combo.selections]);

  // Cote totale ajustée : produit des cotes des sélections non-void.
  // Une sélection annulée compte ×1 dans la convention bookmaker FR.
  const adjustedOdd = useMemo(() => {
    let odd = 1;
    combo.selections.forEach((s) => {
      if (s.result !== 'void') odd *= s.odd;
    });
    return Math.round(odd * 100) / 100;
  }, [combo.selections]);

  // Sports présents (mono ou multi-sport)
  const sports = useMemo(() => {
    const set = new Set(combo.selections.map((s) => s.sport));
    return Array.from(set);
  }, [combo.selections]);

  const bgImage = getComboBg(combo.result, sports);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outerFrame,
        {
          backgroundColor: resultStyle?.border ?? c.gold,
          shadowColor: '#0A0A0A',
          opacity: pressed ? 0.97 : 1,
        },
      ]}>
      {/* Badge "ticket dispo" centré en haut (preuve bookmaker) */}
      {combo.bookmakerScreenshotUrl ? (
        <View style={styles.ticketBadgeWrap} pointerEvents="none">
          <View
            style={[
              styles.ticketBadge,
              { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
            ]}>
            <SymbolView
              name="doc.text.image"
              size={10}
              tintColor={c.gold}
              weight="semibold"
            />
            <Text style={[styles.ticketBadgeText, { color: c.gold }]}>
              Ticket réel
            </Text>
          </View>
        </View>
      ) : null}

      {bgImage ? (
        <ImageBackground
          source={bgImage}
          style={styles.cardBgWrap}
          imageStyle={styles.cardBgImg}>
          <View style={styles.cardBgOverlay} pointerEvents="none" />
          <ComboCardContent
            combo={combo}
            hasAccess={hasAccess}
            onPress={onPress}
            resultStyle={resultStyle}
            isResolved={isResolved}
            counts={counts}
            adjustedOdd={adjustedOdd}
            sports={sports}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: resultStyle ? resultStyle.bg : c.bgElevated,
            },
          ]}>
          <ComboCardContent
            combo={combo}
            hasAccess={hasAccess}
            onPress={onPress}
            resultStyle={resultStyle}
            isResolved={isResolved}
            counts={counts}
            adjustedOdd={adjustedOdd}
            sports={sports}
            expanded={expanded}
            setExpanded={setExpanded}
          />
        </View>
      )}
    </Pressable>
  );
}

function ComboCardContent({
  combo,
  hasAccess,
  onPress,
  resultStyle,
  isResolved,
  counts,
  adjustedOdd,
  sports,
  expanded,
  setExpanded,
}: {
  combo: ComboBet;
  hasAccess: boolean;
  onPress: () => void;
  resultStyle: (typeof RESULT_STYLE)[keyof typeof RESULT_STYLE] | null;
  isResolved: boolean;
  counts: { wins: number; losses: number; voids: number; played: number; total: number };
  /** Cote totale ajustée (exclut les sélections void). */
  adjustedOdd: number;
  sports: ComboBetSelection['sport'][];
  expanded: boolean;
  setExpanded: (v: ((prev: boolean) => boolean) | boolean) => void;
}) {
  const c = useThemeColors();
  return (
    <>
        {/* ===== HEADER : statut + label + sport + nb sélections ===== */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {resultStyle ? (
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: resultStyle.chip },
                ]}>
                <Text style={styles.statusChipText}>{resultStyle.label}</Text>
              </View>
            ) : combo.result === 'live' ? (
              <View style={[styles.statusChip, { backgroundColor: COLOR_LIVE }]}>
                <View style={styles.livePulse} />
                <Text style={styles.statusChipText}>LIVE</Text>
              </View>
            ) : null}
            <Text style={[styles.label, { color: c.text }]}>Combiné</Text>
            <View style={styles.sportsRow}>
              {sports.map((sp) =>
                sp === 'tennis' ? (
                  <View key={sp} style={styles.tennisBg}>
                    <SymbolView
                      name="tennisball"
                      size={11}
                      tintColor="#D4FF00"
                      weight="bold"
                    />
                  </View>
                ) : (
                  <SymbolView
                    key={sp}
                    name="soccerball"
                    size={14}
                    type="multicolor"
                    weight="bold"
                  />
                ),
              )}
              <Text style={[styles.selCount, { color: c.textMuted }]}>
                {counts.total}
              </Text>
            </View>
          </View>
          {/* Badge progression : combien de matchs sont déjà passés */}
          {!isResolved && counts.played > 0 && counts.played < counts.total ? (
            <View
              style={[
                styles.progressBadge,
                {
                  borderColor: c.gold,
                  backgroundColor: 'rgba(232,201,90,0.12)',
                },
              ]}>
              <View style={[styles.progressDot, { backgroundColor: c.gold }]} />
              <Text style={[styles.progressBadgeText, { color: c.gold }]}>
                {counts.played}/{counts.total} joués
              </Text>
            </View>
          ) : null}
        </View>

        {/* ===== Barre proportions V/D (uniquement si résolu) ===== */}
        {isResolved && counts.total > 0 ? (
          <View style={styles.propBar}>
            <View
              style={{
                flex: counts.wins,
                backgroundColor: COLOR_WIN,
                borderTopLeftRadius: 3,
                borderBottomLeftRadius: 3,
              }}
            />
            <View
              style={{
                flex: counts.losses,
                backgroundColor: COLOR_LOSS,
                borderTopRightRadius: 3,
                borderBottomRightRadius: 3,
              }}
            />
          </View>
        ) : null}

        {/* ===== Toggle + compteurs (compteurs seulement si résolu) + confiance ===== */}
        <View style={styles.toggleRow}>
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            hitSlop={6}
            style={({ pressed }) => [
              styles.toggleBtn,
              {
                backgroundColor: c.bgDeeper,
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <SymbolView
              name={expanded ? 'chevron.up' : 'chevron.down'}
              size={12}
              tintColor={c.text}
              weight="bold"
            />
          </Pressable>

          {isResolved ? (
            <>
              <View
                style={[
                  styles.countChip,
                  { borderColor: COLOR_WIN, backgroundColor: 'transparent' },
                ]}>
                <SymbolView
                  name="checkmark"
                  size={10}
                  tintColor={COLOR_WIN}
                  weight="bold"
                />
                <Text style={[styles.countChipText, { color: COLOR_WIN }]}>
                  {counts.wins}
                </Text>
              </View>
              <View
                style={[
                  styles.countChip,
                  { borderColor: COLOR_LOSS, backgroundColor: 'transparent' },
                ]}>
                <SymbolView
                  name="xmark"
                  size={10}
                  tintColor={COLOR_LOSS}
                  weight="bold"
                />
                <Text style={[styles.countChipText, { color: COLOR_LOSS }]}>
                  {counts.losses}
                </Text>
              </View>
            </>
          ) : null}

          <View style={{ flex: 1 }} />

          <View style={styles.confidenceCol}>
            <ConfidenceDots
              value={combo.confidence}
              showLabel={false}
              dotSize={8}
            />
            <Text style={[styles.confidenceLabel, { color: c.textMuted }]}>
              {CONFIDENCE_LABEL[combo.confidence]}
            </Text>
          </View>
        </View>

        {/* ===== Détail sélections (si expanded ou si verrouillé) ===== */}
        {expanded && hasAccess ? (
          <View style={styles.selectionsList}>
            {combo.selections.map((sel, i) => (
              <SelectionRow key={i} selection={sel} index={i + 1} />
            ))}
          </View>
        ) : !hasAccess ? (
          <LockedSelections minTier={combo.minTier} />
        ) : null}

        {/* ===== Footer : cote totale (ajustée si void) + CTA ===== */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={[styles.footerLabel, { color: c.textMuted }]}>
              COTE TOTALE
            </Text>
            <View style={styles.oddBadgeStack}>
              {counts.voids > 0 ? (
                <Text
                  style={[styles.oddInitial, { color: c.textDim }]}>
                  initiale {combo.combinationOdd.toFixed(2)}
                </Text>
              ) : null}
              <View style={[styles.oddBadge, { backgroundColor: c.gold }]}>
                <Text style={styles.oddBadgeText}>
                  {adjustedOdd.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={onPress}
            hitSlop={6}
            style={({ pressed }) => [
              styles.ctaBtn,
              { opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.ctaText, { color: c.gold }]}>
              {hasAccess ? 'Analyse →' : 'Débloquer →'}
            </Text>
          </Pressable>
        </View>
    </>
  );
}

// =============================================================================
// Sélection en mode déplié
// =============================================================================
function SelectionRow({
  selection,
  index,
}: {
  selection: ComboBetSelection;
  index: number;
}) {
  const c = useThemeColors();
  const isVoid = selection.result === 'void';
  return (
    <View
      style={[
        styles.selRow,
        { borderTopColor: c.borderFaint, opacity: isVoid ? 0.6 : 1 },
      ]}>
      <Text style={[styles.selIndex, { color: c.textDim }]}>{index}</Text>

      <View style={styles.selBody}>
        <View style={styles.selMatchRow}>
          {selection.sport === 'tennis' ? (
            <View style={styles.tennisBg}>
              <SymbolView
                name="tennisball"
                size={10}
                tintColor="#D4FF00"
                weight="bold"
              />
            </View>
          ) : (
            <SymbolView
              name="soccerball"
              size={12}
              type="multicolor"
              weight="bold"
            />
          )}
          <Text
            style={[
              styles.selMatch,
              {
                color: c.text,
                textDecorationLine: isVoid ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}>
            {displayTeamName(selection.teamHome)} vs {displayTeamName(selection.teamAway)}
          </Text>
        </View>
        <Text
          style={[
            styles.selPrediction,
            {
              color: c.textMuted,
              textDecorationLine: isVoid ? 'line-through' : 'none',
            },
          ]}
          numberOfLines={1}>
          {selection.prediction}
        </Text>
      </View>

      <View style={styles.selRight}>
        <Text
          style={[
            styles.selOdd,
            {
              color: c.text,
              textDecorationLine: isVoid ? 'line-through' : 'none',
            },
          ]}>
          {selection.odd.toFixed(2)}
        </Text>
        <SelectionStatusIcon result={selection.result} />
      </View>

      {/* Watermark "ANNULÉ" en diagonale par-dessus toute la ligne.
          Convention tampon "VOID" comme sur les tickets bookmaker. */}
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

function SelectionStatusIcon({ result }: { result: PronoResult }) {
  if (result === 'win') {
    return (
      <View style={[styles.statusIconWrap, { backgroundColor: COLOR_WIN }]}>
        <SymbolView name="checkmark" size={10} tintColor="#FFFFFF" weight="bold" />
      </View>
    );
  }
  if (result === 'loss') {
    return (
      <View style={[styles.statusIconWrap, { backgroundColor: COLOR_LOSS }]}>
        <SymbolView name="xmark" size={10} tintColor="#FFFFFF" weight="bold" />
      </View>
    );
  }
  if (result === 'live') {
    return (
      <View style={[styles.statusIconWrap, { backgroundColor: COLOR_LIVE }]}>
        <View style={styles.livePulseMini} />
      </View>
    );
  }
  if (result === 'void') {
    return (
      <View style={[styles.statusIconWrap, { backgroundColor: COLOR_VOID }]}>
        <SymbolView name="minus" size={10} tintColor="#FFFFFF" weight="bold" />
      </View>
    );
  }
  // pending : juste un cercle vide
  return (
    <View
      style={[
        styles.statusIconWrap,
        {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: 'rgba(10, 10, 10, 0.2)',
        },
      ]}
    />
  );
}

// =============================================================================
// Verrouillage si pas le bon pack
// =============================================================================
const TIER_LABEL = { starter: 'STARTER', pro: 'PRO', vip: 'VIP' } as const;

function LockedSelections({ minTier }: { minTier: ComboBet['minTier'] }) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.lockedBlock,
        { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
      ]}>
      <SymbolView name="lock.fill" size={14} tintColor={c.gold} weight="semibold" />
      <Text style={[styles.lockedText, { color: c.text }]}>
        Pack {TIER_LABEL[minTier]} requis pour voir les sélections
      </Text>
    </View>
  );
}

// =============================================================================
const styles = StyleSheet.create({
  // Outer frame doré uniforme (couleur signature combiné)
  outerFrame: {
    borderRadius: 18,
    padding: 3,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  // — Badge "ticket réel dispo" centré en haut, chevauche la bordure —
  ticketBadgeWrap: {
    position: 'absolute',
    top: -10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  ticketBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  card: {
    borderRadius: 15,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardBgWrap: {
    borderRadius: 15,
    padding: Spacing.three,
    gap: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
  },
  cardBgImg: {
    borderRadius: 15,
    resizeMode: 'cover',
  },
  cardBgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  confidenceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  confidenceLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // — Header —
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  livePulseMini: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sportsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selCount: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 2,
  },
  progressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  progressBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tennisBg: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // — Barre proportions —
  propBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 2,
  },
  // — Toggle row —
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  // — Selections list (mode déplié) —
  selectionsList: {
    gap: 0,
    marginTop: 2,
  },
  selRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    position: 'relative',
    overflow: 'hidden',
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    opacity: 0.6,
    borderWidth: 2.5,
    paddingHorizontal: 12,
    paddingVertical: 2,
    // Effet "tampon" : police italique
    fontStyle: 'italic',
  },
  selIndex: {
    fontSize: 11,
    fontWeight: '700',
    width: 12,
    textAlign: 'center',
  },
  selBody: {
    flex: 1,
    gap: 2,
  },
  selMatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selMatch: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  selPrediction: {
    fontSize: 12,
    fontWeight: '500',
  },
  selRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selOdd: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  selVoidLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // — Verrouillé —
  lockedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 2,
  },
  lockedText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  // — Footer —
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10, 10, 10, 0.06)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  oddBadgeStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  oddInitial: {
    fontSize: 10,
    fontWeight: '600',
    textDecorationLine: 'line-through',
    letterSpacing: 0.2,
  },
  oddBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  oddBadgeText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ctaBtn: {
    paddingVertical: 4,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
