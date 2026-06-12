import { Image } from 'expo-image';
import {
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from 'react-native';

import type { Pack } from '@/constants/packs';

// =============================================================================
// MODE DEBUG — passer à true pour calibrer les zones (rectangles colorés)
// =============================================================================
const DEBUG = false;

// Couleurs unique par zone pour bien les distinguer en mode debug
const DEBUG_COLORS = {
  name: 'rgba(255, 50, 50, 0.35)',      // ROUGE
  price: 'rgba(50, 150, 255, 0.35)',    // BLEU
  f1: 'rgba(50, 220, 50, 0.30)',         // VERT
  f2: 'rgba(255, 200, 50, 0.30)',        // JAUNE
  f3: 'rgba(220, 100, 255, 0.30)',       // VIOLET
  f4: 'rgba(50, 220, 220, 0.30)',        // CYAN
  cta: 'rgba(255, 100, 200, 0.35)',      // ROSE
};

// =============================================================================
// COORDONNÉES DES ZONES (en %) — calibrables indépendamment par tier
// =============================================================================
type ZoneCoords = { top: DimensionValue; height: DimensionValue };
type CardZones = {
  name: ZoneCoords;
  price: ZoneCoords;
  features: [ZoneCoords, ZoneCoords, ZoneCoords, ZoneCoords];
  cta: ZoneCoords;
  featuresHorizontal: { left: DimensionValue; right: DimensionValue };
};

const ZONES_BY_TIER: Record<Pack['tier'], CardZones> = {
  starter: {
    name: { top: '14.5%', height: '6%' },
    price: { top: '27%', height: '18%' },
    features: [
      { top: '48.2%', height: '7%' },
      { top: '56%', height: '7%' },
      { top: '63%', height: '7%' },
      { top: '71%', height: '7%' },
    ],
    cta: { top: '81.5%', height: '7%' },
    featuresHorizontal: { left: '25.5%', right: '12.5%' },
  },
  pro: {
    name: { top: '14.5%', height: '6%' },
    price: { top: '27%', height: '18%' },
    features: [
      { top: '49.7%', height: '7%' },
      { top: '57%', height: '7%' },
      { top: '64.5%', height: '7%' },
      { top: '72%', height: '7%' },
    ],
    cta: { top: '83.5%', height: '7%' },
    featuresHorizontal: { left: '25.5%', right: '12.5%' },
  },
  vip: {
    name: { top: '14.5%', height: '6%' },
    price: { top: '27%', height: '18%' },
    features: [
      { top: '49.2%', height: '7%' },
      { top: '56.5%', height: '7%' },
      { top: '63.5%', height: '7%' },
      { top: '71%', height: '7%' },
    ],
    cta: { top: '82.5%', height: '7%' },
    featuresHorizontal: { left: '25.5%', right: '12.5%' },
  },
};

// =============================================================================

const FRAMES: Record<Pack['tier'], ImageSourcePropType> = {
  starter: require('@/assets/images/pricing/starter-frame.png'),
  pro: require('@/assets/images/pricing/pro-frame.png'),
  vip: require('@/assets/images/pricing/vip-frame.png'),
};

type Props = {
  pack: Pack;
  isCurrent: boolean;
  onPress: () => void;
};

export function PricingCard({ pack, isCurrent, onPress }: Props) {
  const price = pack.monthly;
  const period = '/ mois';
  const showBadge = !!pack.badge && !isCurrent;
  const zones = ZONES_BY_TIER[pack.tier];

  return (
    <View style={styles.wrapper}>
      {showBadge ? (
        <View style={styles.badgeFloat}>
          <Text style={styles.badgeText}>{pack.badge!.toUpperCase()}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onPress}
        disabled={isCurrent}
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed && !isCurrent ? 0.85 : 1 },
        ]}>
        <Image
          source={FRAMES[pack.tier]}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
        />

        {/* ZONE NAME (ROUGE) */}
        <DebugZone color={DEBUG_COLORS.name} label="NAME" coords={zones.name} centered>
          <Text style={styles.nameText}>{pack.name.toUpperCase()}</Text>
        </DebugZone>

        {/* ZONE PRICE (BLEU) */}
        <DebugZone color={DEBUG_COLORS.price} label="PRICE" coords={zones.price} centered>
          <View style={styles.priceRow}>
            <Text style={styles.priceText}>{price}</Text>
            <Text style={styles.periodText}>{period}</Text>
          </View>
          {pack.cap ? <Text style={styles.capText}>{pack.cap}</Text> : null}
        </DebugZone>

        {/* ZONES FEATURES 1-4 (VERT / JAUNE / VIOLET / CYAN) */}
        {pack.features.slice(0, 4).map((f, i) => {
          const colorKey = (['f1', 'f2', 'f3', 'f4'] as const)[i];
          return (
            <DebugZone
              key={i}
              color={DEBUG_COLORS[colorKey]}
              label={`F${i + 1}`}
              coords={{
                top: zones.features[i].top,
                height: zones.features[i].height,
                left: zones.featuresHorizontal.left,
                right: zones.featuresHorizontal.right,
              }}>
              <Text style={styles.featureText} numberOfLines={2}>
                {f}
              </Text>
            </DebugZone>
          );
        })}

        {/* ZONE CTA (ROSE) */}
        <DebugZone color={DEBUG_COLORS.cta} label="CTA" coords={zones.cta} centered>
          <Text style={styles.ctaText}>
            {isCurrent ? 'PACK ACTUEL' : `CHOISIR ${pack.name.toUpperCase()}`}
          </Text>
        </DebugZone>
      </Pressable>
    </View>
  );
}

function DebugZone({
  color,
  label,
  coords,
  centered,
  children,
}: {
  color: string;
  label: string;
  coords: { top: DimensionValue; height: DimensionValue; left?: DimensionValue; right?: DimensionValue };
  centered?: boolean;
  children: React.ReactNode;
}) {
  const debugCoordsLabel = `${label} · top:${coords.top} · h:${coords.height}${
    coords.left ? ` · L:${coords.left}` : ''
  }${coords.right ? ` · R:${coords.right}` : ''}`;

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: coords.top,
          height: coords.height,
          left: coords.left ?? 0,
          right: coords.right ?? 0,
          justifyContent: 'center',
        },
        centered && { alignItems: 'center' },
        DEBUG && { backgroundColor: color, borderColor: '#FFF', borderWidth: 0.5 },
      ]}>
      {children}
      {DEBUG ? (
        <View style={styles.debugLabel}>
          <Text style={styles.debugLabelText}>{debugCoordsLabel}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    paddingTop: 12,
  },
  badgeFloat: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 10,
  },
  badgeText: {
    color: '#0A0A0A',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  card: {
    aspectRatio: 1086 / 1448,
    width: '100%',
    position: 'relative',
  },
  nameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  periodText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
  capText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 13,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  debugLabel: {
    position: 'absolute',
    top: -2,
    left: 2,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  debugLabelText: {
    color: '#FFF',
    fontSize: 8,
    fontWeight: '700',
  },
});
