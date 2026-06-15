/**
 * HomeBetCard — Carte prono compacte pour l'écran d'Accueil.
 *
 * Différences vs PronoCard/ComboBetCard utilisés dans l'onglet Pronos :
 *  - Image bg dynamique selon sport + statut (cf. resolveBgImage)
 *  - Format compact ~110-130px (vs ~200+ pour les autres cards)
 *  - Combo affiché en mode résumé : "Combiné · N sélections" + sport +
 *    nb jours + cote totale, SANS lister les sélections
 *  - Border colorée + chip statut selon pending/live/win/loss/void
 *
 * Volontairement séparé de PronoCard pour ne pas casser les autres écrans
 * (carnet, liste des pronos par jour, etc.).
 */

import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { Spacing } from '@/constants/theme';
import { displayTeamName } from '@/lib/team-display-names';
import { useThemeColors } from '@/lib/use-theme-colors';
import {
  getBetActiveDates,
  type AnyBet,
  type ComboBet,
  type Prono,
  type PronoResult,
  type Sport,
} from '@/types/prono';

// ============================================================
// Mapping bg images selon sport + statut
// ============================================================
const BG = {
  pending: {
    foot: require('@/assets/images/bg-card-pending-foot.png'),
    tennis: require('@/assets/images/bg-card-pending-tennis.png'),
    mixed: require('@/assets/images/bg-card-pending-mixed.png'),
  },
  won: {
    foot: require('@/assets/images/bg-card-won.png'),
    tennis: require('@/assets/images/bg-card-won-tennis.png'),
    mixed: require('@/assets/images/bg-card-won-combo.png'),
  },
  lost: {
    foot: require('@/assets/images/bg-card-lost.png'),
    tennis: require('@/assets/images/bg-card-lost-tennis.png'),
    mixed: require('@/assets/images/bg-card-lost-combo.png'),
  },
} as const;

type SportKey = 'foot' | 'tennis' | 'mixed';
type StatusKey = 'pending' | 'live' | 'win' | 'loss' | 'void';

function detectSport(bet: AnyBet): SportKey {
  if (bet.type === 'single') return bet.sport;
  // Combo : mixed si au moins un foot et un tennis, sinon le sport uniforme
  const sports = new Set<Sport>(bet.selections.map((s) => s.sport));
  if (sports.size > 1) return 'mixed';
  return (sports.values().next().value ?? 'foot') as SportKey;
}

function resolveBgImage(sport: SportKey, status: StatusKey): ImageSourcePropType {
  // Live et void → on réutilise le bg "pending" (mêmes images, le statut
  // est signalé par le chip + bordure)
  if (status === 'pending' || status === 'live' || status === 'void') {
    return BG.pending[sport];
  }
  if (status === 'win') return BG.won[sport];
  return BG.lost[sport];
}

function statusFromResult(result: PronoResult): StatusKey {
  if (result === 'win') return 'win';
  if (result === 'loss') return 'loss';
  if (result === 'live') return 'live';
  if (result === 'void') return 'void';
  return 'pending';
}

// ============================================================
// Helpers
// ============================================================

/** Nombre de jours uniques entre la 1ère et la dernière sélection d'un combo */
function daysSpan(bet: ComboBet): number {
  const days = new Set<string>(
    bet.selections.map((s) => s.matchStartAt.slice(0, 10)),
  );
  return days.size;
}

/** Initiales pour fallback logo joueur tennis (ex: "S. Sierra" → "SS") */
function initialsFor(name: string): string {
  const clean = name.replace(/[^A-Za-zÀ-ÿ\s\.\-]/g, '');
  const parts = clean.split(/[\s\.\-]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ============================================================
// Composant principal
// ============================================================

export function HomeBetCard({
  bet,
  hasAccess,
  onPress,
}: {
  bet: AnyBet;
  hasAccess: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const sportKey = detectSport(bet);
  const status = statusFromResult(bet.result);
  const bgImage = resolveBgImage(sportKey, status);

  // Couleurs de bordure selon statut. Pour pending → transparent
  // (laisse l'image bg respirer sans liseré blanc).
  const borderColor = useMemo(() => {
    if (status === 'live') return 'rgba(251,191,36,0.45)';
    if (status === 'win') return 'rgba(52,211,153,0.40)';
    if (status === 'loss') return 'rgba(248,113,113,0.40)';
    if (status === 'void') return 'rgba(250,250,247,0.18)';
    return 'transparent';
  }, [status]);

  return (
    <View style={styles.cardWrap}>
      {/* Badge ticket bookmaker (centré en haut, chevauche la bordure) —
          rendu HORS du Pressable (qui a overflow:hidden) pour ne pas être
          clippé par le top négatif. */}
      {bet.bookmakerScreenshotUrl ? (
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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor,
          borderWidth: status === 'pending' ? StyleSheet.hairlineWidth : 1.2,
          borderStyle: status === 'void' ? 'dashed' : 'solid',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {/* BG image */}
      <ExpoImage
        source={bgImage}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      {/* Overlay sombre principal pour lisibilité texte + étouffer les
          couleurs parasites de l'image bg (rouge/orange des effets
          décoratifs win/loss). */}
      <View style={styles.overlay} pointerEvents="none" />
      {/* Tint coloré selon statut — très subtle, juste pour renforcer
          l'identité win=vert, loss=rouge, live=orange. */}
      {status === 'win' ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(52,211,153,0.08)' }]}
        />
      ) : status === 'loss' ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(248,113,113,0.08)' }]}
        />
      ) : status === 'live' ? (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(251,191,36,0.08)' }]}
        />
      ) : null}

      {/* Pulse live (en haut à droite) */}
      {status === 'live' ? (
        <View style={styles.livePulse} pointerEvents="none" />
      ) : null}

      {bet.type === 'single' ? (
        <SingleContent
          prono={bet as Prono}
          status={status}
          hasAccess={hasAccess}
        />
      ) : (
        <ComboContent
          combo={bet as ComboBet}
          status={status}
          sportKey={sportKey}
          hasAccess={hasAccess}
        />
      )}
    </Pressable>
    </View>
  );
}

// ============================================================
// Contenu SINGLE
// ============================================================

function SingleContent({
  prono,
  status,
  hasAccess,
}: {
  prono: Prono;
  status: StatusKey;
  hasAccess: boolean;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.content}>
      {/* Head : compétition + chip statut/pack */}
      <View style={styles.head}>
        <View style={styles.compRow}>
          <View style={[styles.compDot, { backgroundColor: c.gold }]} />
          <Text style={styles.comp} numberOfLines={1}>
            {prono.competition}
          </Text>
        </View>
        <StatusOrTierChip status={status} tier={prono.minTier} />
      </View>

      {/* Équipes */}
      <View style={styles.teamsRow}>
        <TeamLabel name={prono.teamHome} logo={prono.teamHomeLogo} sport={prono.sport} align="left" />
        <Text style={[styles.vs, { color: c.textDim }]}>VS</Text>
        <TeamLabel name={prono.teamAway} logo={prono.teamAwayLogo} sport={prono.sport} align="right" />
      </View>

      {/* Prédiction + cote (seulement si accès) */}
      <View style={[styles.predRow, { borderTopColor: 'rgba(250,250,247,0.10)' }]}>
        {hasAccess ? (
          <>
            <Text style={styles.pred} numberOfLines={1}>
              <Text style={[styles.predLabel, { color: c.gold }]}>Notre prono · </Text>
              {prono.prediction}
            </Text>
            <View style={[styles.odd, { backgroundColor: c.gold }]}>
              <Text style={styles.oddText}>{prono.odd.toFixed(2)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.lockedRow}>
            <SymbolView name="lock.fill" size={11} tintColor={c.gold} weight="semibold" />
            <Text style={[styles.lockedText, { color: '#fafaf7' }]}>
              Réservé {prono.minTier === 'vip' ? 'VIP' : prono.minTier === 'pro' ? 'Pro' : 'Starter'}
            </Text>
          </View>
        )}
      </View>

      {/* Ligne résultat si win/loss */}
      {status === 'win' && prono.finalScore ? (
        <View style={[styles.resultLine, { borderTopColor: 'rgba(250,250,247,0.10)' }]}>
          <Text style={[styles.resultIcon, { color: '#34d399' }]}>✓</Text>
          <Text style={styles.resultText}>Cote x{prono.odd.toFixed(2)} réalisée</Text>
          <Text style={styles.finalScore}>{prono.finalScore}</Text>
        </View>
      ) : null}
      {status === 'loss' && prono.finalScore ? (
        <View style={[styles.resultLine, { borderTopColor: 'rgba(250,250,247,0.10)' }]}>
          <Text style={[styles.resultIcon, { color: '#f87171' }]}>✕</Text>
          <Text style={styles.resultText}>Mise perdue</Text>
          <Text style={styles.finalScore}>{prono.finalScore}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ============================================================
// Contenu COMBO (format compact résumé)
// ============================================================

function ComboContent({
  combo,
  status,
  sportKey,
  hasAccess,
}: {
  combo: ComboBet;
  status: StatusKey;
  sportKey: SportKey;
  hasAccess: boolean;
}) {
  const c = useThemeColors();
  const span = daysSpan(combo);

  // Compétition affichée : si toutes les sélections sont sur la même
  // compétition, on la montre ; sinon "Multi-compétitions"
  const competitionLabel = useMemo(() => {
    const comps = new Set(combo.selections.map((s) => s.competition));
    if (comps.size === 1) return Array.from(comps)[0];
    return 'Multi-compétitions';
  }, [combo]);

  // Sport label sous le titre (cohérent avec le bg)
  const sportLabel = sportKey === 'tennis' ? 'Tennis' : sportKey === 'mixed' ? 'Foot + Tennis' : 'Foot';

  // Icône principale : N sélections / ✓ / ✕ selon statut
  const iconContent = status === 'win' ? '✓' : status === 'loss' ? '✕' : `${combo.selections.length}`;
  const iconColor = status === 'win' ? '#34d399' : status === 'loss' ? '#f87171' : c.gold;
  const iconBg =
    status === 'win'
      ? 'rgba(52,211,153,0.18)'
      : status === 'loss'
        ? 'rgba(248,113,113,0.18)'
        : 'rgba(184,148,31,0.18)';
  const iconBorder =
    status === 'win'
      ? 'rgba(52,211,153,0.4)'
      : status === 'loss'
        ? 'rgba(248,113,113,0.4)'
        : 'rgba(184,148,31,0.35)';

  return (
    <View style={styles.content}>
      {/* Head : icône + titre/sous-titre + chip statut/pack */}
      <View style={styles.head}>
        <View style={styles.comboTitleRow}>
          <View
            style={[
              styles.comboIcon,
              { backgroundColor: iconBg, borderColor: iconBorder },
            ]}>
            <Text style={[styles.comboIconText, { color: iconColor }]}>
              {iconContent}
            </Text>
          </View>
          <View style={styles.comboTitleText}>
            <Text style={styles.comboTitleMain}>
              Combiné · {combo.selections.length} sélections
            </Text>
            <Text style={styles.comboTitleSub} numberOfLines={1}>
              {competitionLabel} · {sportLabel}
            </Text>
          </View>
        </View>
        <StatusOrTierChip status={status} tier={combo.minTier} liveLabel={`LIVE ${countResolved(combo)}/${combo.selections.length}`} />
      </View>

      {/* Footer : nb jours + cote totale */}
      <View style={[styles.comboFoot, { borderTopColor: 'rgba(250,250,247,0.10)' }]}>
        <SymbolView name="calendar" size={11} tintColor={c.gold} weight="medium" />
        <Text style={styles.comboMetaText}>
          Étalé sur {span} jour{span > 1 ? 's' : ''}
        </Text>
        <View style={styles.comboOddBlock}>
          <Text style={styles.comboOddLabel}>Cote totale</Text>
          {hasAccess ? (
            <View
              style={[
                styles.odd,
                {
                  backgroundColor: c.gold,
                  opacity: status === 'loss' ? 0.7 : 1,
                },
              ]}>
              <Text style={styles.oddText}>{combo.combinationOdd.toFixed(2)}</Text>
            </View>
          ) : (
            <View style={styles.lockedRow}>
              <SymbolView name="lock.fill" size={10} tintColor={c.gold} weight="semibold" />
              <Text style={[styles.lockedText, { color: '#fafaf7', fontSize: 10 }]}>
                {combo.minTier === 'vip' ? 'VIP' : 'Pro'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function countResolved(combo: ComboBet): number {
  return combo.selections.filter(
    (s) => s.result === 'win' || s.result === 'loss',
  ).length;
}

// ============================================================
// Sub-components partagés
// ============================================================

function TeamLabel({
  name,
  logo,
  sport,
  align,
}: {
  name: string;
  logo?: string;
  sport: Sport;
  align: 'left' | 'right';
}) {
  const c = useThemeColors();
  const display = displayTeamName(name);
  return (
    <View
      style={[
        styles.team,
        align === 'right' && { flexDirection: 'row-reverse', justifyContent: 'flex-end' },
      ]}>
      {logo ? (
        <ExpoImage source={{ uri: logo }} style={styles.teamLogo} contentFit="contain" />
      ) : (
        <View style={[styles.teamLogoFallback, { backgroundColor: 'rgba(184,148,31,0.18)', borderColor: 'rgba(184,148,31,0.35)' }]}>
          {sport === 'tennis' ? (
            <Text style={[styles.teamLogoInitials, { color: c.gold }]}>
              {initialsFor(name)}
            </Text>
          ) : (
            <SymbolView name="soccerball" size={11} tintColor={c.gold} weight="semibold" />
          )}
        </View>
      )}
      <Text style={[styles.teamName, { color: '#fafaf7' }]} numberOfLines={1}>
        {display}
      </Text>
    </View>
  );
}

function StatusOrTierChip({
  status,
  tier,
  liveLabel,
}: {
  status: StatusKey;
  tier: Prono['minTier'];
  liveLabel?: string;
}) {
  if (status === 'live') {
    return <Chip label={liveLabel ?? 'LIVE'} color="#fbbf24" bg="rgba(251,191,36,0.28)" border="rgba(251,191,36,0.4)" />;
  }
  if (status === 'win') {
    return <Chip label="✓ GAGNÉ" color="#34d399" bg="rgba(52,211,153,0.22)" border="rgba(52,211,153,0.35)" />;
  }
  if (status === 'loss') {
    return <Chip label="✕ PERDU" color="#f87171" bg="rgba(248,113,113,0.22)" border="rgba(248,113,113,0.35)" />;
  }
  if (status === 'void') {
    return <Chip label="⌀ ANNULÉ" color="rgba(250,250,247,0.55)" bg="rgba(250,250,247,0.10)" border="rgba(250,250,247,0.18)" />;
  }
  // Pending : chip de tier (Pro / VIP / Starter)
  if (tier === 'vip') return <Chip label="VIP" color="#b8941f" bg="rgba(184,148,31,0.22)" />;
  if (tier === 'pro') return <Chip label="Pro" color="#60a5fa" bg="rgba(96,165,250,0.18)" />;
  return <Chip label="Starter" color="rgba(250,250,247,0.72)" bg="rgba(250,250,247,0.10)" />;
}

function Chip({
  label,
  color,
  bg,
  border,
}: {
  label: string;
  color: string;
  bg: string;
  border?: string;
}) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: bg, borderColor: border ?? 'transparent', borderWidth: border ? 1 : 0 },
      ]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Wrapper extérieur en overflow:visible pour que le badge "Ticket réel"
  // puisse chevaucher la bordure de la card (top négatif).
  cardWrap: {
    width: 320,
    position: 'relative',
  },
  card: {
    width: 320,
    minHeight: 128,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(10,10,10,0.75)',
  },
  livePulse: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fbbf24',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  // Wrap full-width au-dessus de la card pour centrer le badge "Ticket réel"
  // horizontalement, en le faisant chevaucher la bordure (top négatif).
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
  content: {
    padding: 12,
    gap: 7,
    flex: 1,
    justifyContent: 'space-between',
  },
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  compRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  compDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  comp: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fafaf7',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flexShrink: 1,
  },
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  chipText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  teamLogo: {
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  teamLogoFallback: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamLogoInitials: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  teamName: {
    fontSize: 13.5,
    fontWeight: '700',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  vs: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  predRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    gap: 10,
  },
  pred: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(250,250,247,0.82)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  predLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  odd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  oddText: {
    color: '#0a0a0a',
    fontWeight: '800',
    fontSize: 12.5,
    fontVariant: ['tabular-nums'],
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(184,148,31,0.18)',
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resultLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  resultIcon: {
    fontSize: 13,
    fontWeight: '800',
  },
  resultText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(250,250,247,0.82)',
  },
  finalScore: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '800',
    color: '#fafaf7',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // === Combo ===
  comboTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  comboIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comboIconText: {
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  comboTitleText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  comboTitleMain: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#fafaf7',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comboTitleSub: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(250,250,247,0.65)',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  comboFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  comboMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(250,250,247,0.82)',
  },
  comboOddBlock: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  comboOddLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(250,250,247,0.55)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});

// Helper export pour le compteur (utile aux tests / autres composants)
export { getBetActiveDates };
