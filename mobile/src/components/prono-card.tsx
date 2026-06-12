import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { displayTeamName } from '@/lib/team-display-names';
import {
  getCompetitionColor,
  getCompetitionFlag,
  getSportSymbol,
  SPORT_COLOR,
} from '@/lib/competition-meta';
import { formatHour } from '@/lib/format-date';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { Prono } from '@/types/prono';

import { ConfidenceDots } from './confidence-dots';

/** Mapping sport + résultat → image background pour la card (ballon
 *  vert/rouge selon sport et résultat). Utilisé partout dans l'app
 *  pour les cards de paris résolus. Pour 'void', pas d'image. */
function getResolvedBg(sport: Prono['sport'], result: 'win' | 'loss') {
  if (sport === 'tennis') {
    return result === 'win'
      ? require('@/assets/images/bg-card-won-tennis.png')
      : require('@/assets/images/bg-card-lost-tennis.png');
  }
  return result === 'win'
    ? require('@/assets/images/bg-card-won.png')
    : require('@/assets/images/bg-card-lost.png');
}

/** Bg pour les pronos EN COURS (pending/live) — image dorée sport
 *  spécifique. Permet de distinguer visuellement un pari à venir d'un
 *  pari résolu, et de tagger le sport au premier coup d'œil. */
function getPendingBg(sport: Prono['sport']) {
  return sport === 'tennis'
    ? require('@/assets/images/bg-card-pending-tennis.png')
    : require('@/assets/images/bg-card-pending-foot.png');
}

const TIER_LABEL: Record<Prono['minTier'], string> = {
  starter: 'STARTER',
  pro: 'PRO',
  vip: 'VIP',
};

// Teintes dark pour les cards résolues — refonte DA 2026-06-04 (dark mode).
// Les bg sont en rgba pour rester lisibles avec le texte crème par-dessus.
const RESULT_STYLE = {
  win: {
    bg: 'rgba(16, 185, 129, 0.10)',
    border: '#10B981',
    badgeBg: '#10B981',
    label: 'GAGNÉ',
  },
  loss: {
    bg: 'rgba(239, 68, 68, 0.10)',
    border: '#EF4444',
    badgeBg: '#EF4444',
    label: 'PERDU',
  },
  void: {
    bg: 'rgba(168, 162, 158, 0.10)',
    border: '#A8A29E',
    badgeBg: '#A8A29E',
    label: 'ANNULÉ',
  },
} as const;

type ResolvedResult = keyof typeof RESULT_STYLE;
function getResolvedStyle(result: Prono['result']) {
  if (result === 'win' || result === 'loss' || result === 'void') {
    return RESULT_STYLE[result as ResolvedResult];
  }
  return null;
}

type Props = {
  prono: Prono;
  /** L'utilisateur a-t-il accès à ce prono selon son tier ? */
  hasAccess: boolean;
  onPress: () => void;
};

export function PronoCard({ prono, hasAccess, onPress }: Props) {
  const c = useThemeColors();
  const resultStyle = getResolvedStyle(prono.result);
  const isResolved = resultStyle !== null;
  // Image bg : win/loss → image résultat (ballon vert/rouge),
  // pending/live → image "en cours" (ballon doré sport spécifique).
  // void → pas d'image (sobre).
  const resultBgImage =
    prono.result === 'win' || prono.result === 'loss'
      ? getResolvedBg(prono.sport, prono.result)
      : prono.result === 'pending' || prono.result === 'live'
        ? getPendingBg(prono.sport)
        : null;

  const sportSymbol = getSportSymbol(prono.sport);
  const flagUrl = getCompetitionFlag(prono.competition);
  const competitionColor = getCompetitionColor(prono.competition);

  return (
    <View
      style={[
        styles.outerFrame,
        { backgroundColor: competitionColor, shadowColor: '#0A0A0A' },
      ]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.cardWrap,
          {
            borderColor: resultStyle ? resultStyle.border : 'transparent',
            borderWidth: resultStyle ? 1.5 : 0,
            opacity: pressed ? 0.97 : 1,
          },
        ]}>
      {resultBgImage ? (
        <ImageBackground
          source={resultBgImage}
          style={styles.cardBgWrap}
          imageStyle={styles.cardBgImg}>
          <View style={styles.cardBgOverlay} pointerEvents="none" />
          <CardContent
            prono={prono}
            hasAccess={hasAccess}
            onPress={onPress}
            resultStyle={resultStyle}
            sportSymbol={sportSymbol}
            flagUrl={flagUrl ?? undefined}
            hideTopBadges
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
          <CardContent
            prono={prono}
            hasAccess={hasAccess}
            onPress={onPress}
            resultStyle={resultStyle}
            sportSymbol={sportSymbol}
            flagUrl={flagUrl ?? undefined}
            hideTopBadges
          />
        </View>
      )}
      {/* Badges qui dépassent en haut — rendus EN DEHORS du cardBgWrap
          (qui a overflow:hidden pour clipper l'image bg), ici ils sont
          dans cardWrap qui a overflow:visible. */}
      {resultStyle ? (
        <View
          style={[styles.resultBadge, { backgroundColor: resultStyle.badgeBg }]}
          pointerEvents="none">
          <Text style={styles.resultBadgeText}>{resultStyle.label}</Text>
        </View>
      ) : null}
      {prono.bookmakerScreenshotUrl ? (
        <View
          style={[
            styles.ticketBadge,
            { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
          ]}
          pointerEvents="none">
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
      ) : null}
      </Pressable>
    </View>
  );
}

function CardContent({
  prono,
  hasAccess,
  onPress,
  resultStyle,
  sportSymbol,
  flagUrl,
  hideTopBadges,
}: {
  prono: Prono;
  hasAccess: boolean;
  onPress: () => void;
  resultStyle: ReturnType<typeof getResolvedStyle>;
  sportSymbol: string;
  flagUrl?: string;
  /** Si true, on ne rend pas les badges en haut (gérés en dehors par le
   *  composant parent pour pas se faire clipper par overflow:hidden). */
  hideTopBadges?: boolean;
}) {
  const c = useThemeColors();
  const isResolved = resultStyle !== null;
  return (
    <>
      {/* Badge résultat en haut à droite (si résolu) — sauf si hideTopBadges */}
      {resultStyle && !hideTopBadges ? (
        <View
          style={[styles.resultBadge, { backgroundColor: resultStyle.badgeBg }]}>
          <Text style={styles.resultBadgeText}>{resultStyle.label}</Text>
        </View>
      ) : null}

      {/* Badge "ticket dispo" en haut à gauche (preuve bookmaker) */}
      {prono.bookmakerScreenshotUrl && !hideTopBadges ? (
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
      ) : null}

      {/* ====== TOP STRIP : sport + drapeau + compétition + heure ====== */}
      <View style={styles.topStrip}>
        <View style={styles.topLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                // Foot : fond crème (le noir/blanc du ballon se voit).
                // Tennis : fond noir pour faire ressortir le jaune fluo.
                backgroundColor: prono.sport === 'foot' ? c.bgWarm : '#0A0A0A',
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
                { borderColor: c.borderSoft, backgroundColor: c.bgElevated },
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
        <Text style={[styles.hour, { color: c.text }]}>
          {isResolved && prono.finalScore
            ? prono.finalScore.replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim()
            : formatHour(prono.matchStartAt)}
        </Text>
      </View>

      {/* ====== TEAMS ====== */}
      <View style={styles.teamsRow}>
        <Team
          name={displayTeamName(prono.teamHome)}
          logo={prono.teamHomeLogo}
          align="left"
        />
        <View style={[styles.vsPill, { backgroundColor: c.bgDeeper }]}>
          <Text style={[styles.vsText, { color: c.textMuted }]}>VS</Text>
        </View>
        <Team
          name={displayTeamName(prono.teamAway)}
          logo={prono.teamAwayLogo}
          align="right"
        />
      </View>

      {/* DIVIDER */}
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />

      {/* ====== BODY : prono + cote + confiance OU verrouillage ====== */}
      {hasAccess ? (
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>NOTRE PRONO</Text>

          <View style={styles.predictionRow}>
            <Text
              style={[styles.prediction, { color: c.text }]}
              numberOfLines={2}>
              {prono.prediction}
            </Text>
            <View
              style={[
                styles.oddBlock,
                { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
              ]}>
              <Text
                style={[
                  styles.oddLabel,
                  // Sur card résolue avec image bg, on a un overlay sombre :
                  // muted serait illisible → on force text (crème) pour contraste.
                  { color: isResolved ? c.text : c.textDim },
                ]}>
                COTE
              </Text>
              <Text style={[styles.oddValue, { color: c.text }]}>
                {prono.odd.toFixed(2)}
              </Text>
            </View>
          </View>

          <ConfidenceDots value={prono.confidence} onDarkBg={isResolved} />
        </View>
      ) : (
        <LockedBody minTier={prono.minTier} onPress={onPress} />
      )}

      {/* DIVIDER + FOOTER */}
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />
      <View style={styles.footer}>
        <Text
          style={[styles.cta, { color: hasAccess ? c.text : c.textMuted }]}>
          {!hasAccess
            ? 'Débloquer ce prono'
            : isResolved
              ? 'Voir le détail'
              : 'Voir l’analyse'}
        </Text>
        <SymbolView
          name="arrow.right"
          size={14}
          tintColor={hasAccess ? c.text : c.textMuted}
          weight="semibold"
        />
      </View>
    </>
  );
}

function Team({
  name,
  logo,
  align,
}: {
  name: string;
  logo?: string;
  align: 'left' | 'right';
}) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.team,
        align === 'right' && { flexDirection: 'row-reverse' },
      ]}>
      <View style={[styles.logoWrap, { backgroundColor: c.bgElevated }]}>
        {logo ? (
          <Image
            source={{ uri: logo }}
            style={styles.logoImg}
            contentFit="contain"
          />
        ) : null}
      </View>
      <Text
        style={[
          styles.teamName,
          { color: c.text, textAlign: align },
        ]}
        numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

function LockedBody({
  minTier,
  onPress,
}: {
  minTier: Prono['minTier'];
  onPress: () => void;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.lockedBody}>
      <View style={styles.lockedGhost}>
        <Text style={[styles.eyebrow, { color: c.gold, opacity: 0.3 }]}>
          NOTRE PRONO
        </Text>
        <View style={styles.predictionRow}>
          <Text
            style={[
              styles.prediction,
              styles.lockedText,
              { color: c.text },
            ]}>
            ████████████
          </Text>
          <View
            style={[
              styles.oddBlock,
              { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
            ]}>
            <Text style={[styles.oddLabel, { color: c.textDim }]}>COTE</Text>
            <Text
              style={[styles.oddValue, styles.lockedText, { color: c.text }]}>
              ●,●●
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                borderWidth: 1,
                borderColor: c.borderSoft,
                opacity: 0.4,
              }}
            />
          ))}
        </View>
      </View>

      <Pressable
        onPress={onPress}
        style={[
          styles.lockOverlay,
          { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
        ]}>
        <SymbolView
          name="lock.fill"
          size={14}
          tintColor={c.gold}
          weight="semibold"
        />
        <Text style={[styles.lockText, { color: c.text }]}>
          Pack {TIER_LABEL[minTier]} requis
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  // Outer frame coloré = filet identité compétition (3px)
  outerFrame: {
    borderRadius: 18,
    padding: 3,
    // Shadow iOS subtile portée par le frame
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  cardWrap: {
    borderRadius: 15, // = outerRadius (18) - padding (3) pour fit nickel
    // overflow visible pour que le badge "GAGNÉ" qui dépasse en haut
    // reste affiché. L'ImageBackground a son propre borderRadius sur
    // imageStyle pour clipper l'image au coin arrondi.
    overflow: 'visible',
    position: 'relative',
  },
  card: {
    borderRadius: 15,
    padding: Spacing.three,
    gap: Spacing.three,
    position: 'relative',
  },
  cardBgWrap: {
    borderRadius: 15,
    padding: Spacing.three,
    gap: Spacing.three,
    overflow: 'hidden',
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
    // Overlay sombre fort pour la lisibilité du texte par-dessus le ballon coloré.
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  resultBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.three,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    zIndex: 10,
  },
  resultBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  // — Badge ticket bookmaker —
  ticketBadge: {
    position: 'absolute',
    top: -8,
    left: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 10,
  },
  ticketBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  // — Top strip —
  topStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  topLeft: {
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
    flexShrink: 1,
    textTransform: 'uppercase',
  },
  hour: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  // — Teams —
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  logoImg: {
    width: 28,
    height: 28,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
    flex: 1,
  },
  vsPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  vsText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  // — Body —
  body: {
    paddingVertical: 6,
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  prediction: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
    flex: 1,
  },
  oddBlock: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 72,
  },
  oddLabel: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  oddValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 1,
  },
  // — Footer —
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  cta: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  // — Verrouillé —
  lockedBody: {
    paddingVertical: 6,
    gap: Spacing.two,
    position: 'relative',
  },
  lockedGhost: {
    gap: Spacing.two,
    opacity: 0.35,
  },
  lockedText: {
    letterSpacing: 0,
  },
  lockOverlay: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  lockText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
