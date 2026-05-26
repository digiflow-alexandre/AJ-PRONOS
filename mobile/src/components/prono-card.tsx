import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { formatHour } from '@/lib/format-date';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { Prono } from '@/types/prono';

import { ConfidenceDots } from './confidence-dots';

const TIER_LABEL: Record<Prono['minTier'], string> = {
  starter: 'STARTER',
  pro: 'PRO',
  vip: 'VIP',
};

type Props = {
  prono: Prono;
  /** L'utilisateur a-t-il accès à ce prono selon son tier ? */
  hasAccess: boolean;
  onPress: () => void;
};

export function PronoCard({ prono, hasAccess, onPress }: Props) {
  const c = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.borderFaint,
          opacity: pressed ? 0.96 : 1,
        },
      ]}>
      {/* HEADER : équipes + heure + competition */}
      <View style={styles.header}>
        <View style={styles.teamsRow}>
          <View style={styles.team}>
            {prono.teamHomeLogo ? (
              <Image
                source={{ uri: prono.teamHomeLogo }}
                style={styles.logo}
                contentFit="contain"
              />
            ) : null}
            <Text style={[styles.teamName, { color: c.text }]} numberOfLines={1}>
              {prono.teamHome}
            </Text>
          </View>

          <Text style={[styles.vs, { color: c.textDim }]}>vs</Text>

          <View style={styles.team}>
            {prono.teamAwayLogo ? (
              <Image
                source={{ uri: prono.teamAwayLogo }}
                style={styles.logo}
                contentFit="contain"
              />
            ) : null}
            <Text style={[styles.teamName, { color: c.text }]} numberOfLines={1}>
              {prono.teamAway}
            </Text>
          </View>
        </View>

        <View style={styles.contextRow}>
          <Text style={[styles.context, { color: c.textMuted }]} numberOfLines={1}>
            {prono.competition}
          </Text>
          <View style={styles.contextDot} />
          <Text style={[styles.hour, { color: c.text }]}>
            {formatHour(prono.matchStartAt)}
          </Text>
        </View>
      </View>

      {/* DIVIDER */}
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />

      {/* BODY : prono + cote + confiance OU verrouillage */}
      {hasAccess ? (
        <View style={styles.body}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>NOTRE PRONO</Text>

          <View style={styles.predictionRow}>
            <Text style={[styles.prediction, { color: c.text }]} numberOfLines={2}>
              {prono.prediction}
            </Text>
            <View style={styles.oddBlock}>
              <Text style={[styles.oddLabel, { color: c.textDim }]}>Cote</Text>
              <Text style={[styles.oddValue, { color: c.text }]}>
                {prono.odd.toFixed(2)}
              </Text>
            </View>
          </View>

          <ConfidenceDots value={prono.confidence} />
        </View>
      ) : (
        <LockedBody minTier={prono.minTier} onPress={onPress} />
      )}

      {/* FOOTER : CTA */}
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />
      <View style={styles.footer}>
        <Text style={[styles.cta, { color: hasAccess ? c.text : c.textMuted }]}>
          {hasAccess ? 'Voir l’analyse' : 'Débloquer ce prono'}
        </Text>
        <SymbolView
          name="arrow.right"
          size={14}
          tintColor={hasAccess ? c.text : c.textMuted}
          weight="semibold"
        />
      </View>
    </Pressable>
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
      {/* Background floutée — texte fantôme + overlay */}
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
          <View style={styles.oddBlock}>
            <Text style={[styles.oddLabel, { color: c.textDim }]}>Cote</Text>
            <Text style={[styles.oddValue, styles.lockedText, { color: c.text }]}>
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

      {/* Overlay verrouillage */}
      <Pressable
        onPress={onPress}
        style={[
          styles.lockOverlay,
          {
            backgroundColor: c.bgWarm,
            borderColor: c.goldDecorative,
          },
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
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logo: {
    width: 26,
    height: 26,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  vs: {
    fontSize: 11,
    fontWeight: '600',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  context: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  contextDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#737373',
    opacity: 0.5,
  },
  hour: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
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
    alignItems: 'flex-end',
  },
  oddLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  oddValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
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
  // — État verrouillé —
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
