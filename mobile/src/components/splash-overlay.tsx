/* eslint-disable react-hooks/immutability -- React 19's immutability rule
 * misfires on Reanimated's shared value mutation API (`.value = ...`), which
 * is intentional and documented. Reanimated values are stable refs designed
 * to be mutated from effects ; pas de bug ici. */

import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/lib/use-theme-colors';

// Logo natif : 1536 × 1024. On garde le ratio 3:2.
const SPLASH_LOGO_WIDTH = 260;
const SPLASH_LOGO_HEIGHT = (SPLASH_LOGO_WIDTH * 1024) / 1536;
const HEADER_LOGO_WIDTH = 180;
const HEADER_LOGO_HEIGHT = (HEADER_LOGO_WIDTH * 1024) / 1536;

// Doit matcher exactement la position du logo dans le header du login.
// Top safe-area + padding visuel — descendu pour donner de la place au logo.
const HEADER_LOGO_TOP_PADDING = 72;

type Props = {
  /** Si fourni, indique que l'auth a fini de charger (signal d'autorisation pour démarrer le slide). */
  ready: boolean;
  /** Si la session existe, on fade out direct (pas de slide vers le header). */
  hasSession: boolean;
  onComplete: () => void;
};

export function SplashOverlay({ ready, hasSession, onComplete }: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [done, setDone] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Cible du slide : position finale du logo dans le header du login.
  // On translate depuis le centre vers (top + padding + halfHeader).
  const screenHeight = Dimensions.get('window').height;
  const targetY =
    -screenHeight / 2 +
    insets.top +
    HEADER_LOGO_TOP_PADDING +
    HEADER_LOGO_HEIGHT / 2;
  const targetScale = HEADER_LOGO_WIDTH / SPLASH_LOGO_WIDTH;

  useEffect(() => {
    // Phase 1 : fade-in immédiat. opacity est un sharedValue Reanimated
    // (ref stable, ne re-déclenche pas l'effet).
    opacity.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [opacity]);

  useEffect(() => {
    if (!ready) return;

    // Délai minimum après ready pour laisser le splash respirer
    const HOLD_MS = 700;

    if (hasSession) {
      // Pas de slide — on fade out le tout, vue (app) déjà rendue derrière
      opacity.value = withDelay(
        HOLD_MS,
        withTiming(
          0,
          { duration: 450, easing: Easing.in(Easing.cubic) },
          (finished) => {
            'worklet';
            if (finished) runOnJS(setDone)(true);
          },
        ),
      );
      return;
    }

    // Slide vers la position header + scale down. Login screen déjà rendu derrière.
    translateY.value = withDelay(
      HOLD_MS,
      withTiming(targetY, { duration: 750, easing: Easing.inOut(Easing.cubic) }),
    );
    scale.value = withDelay(
      HOLD_MS,
      withTiming(targetScale, { duration: 750, easing: Easing.inOut(Easing.cubic) }),
    );
    // À la fin du slide, on fade pour passer le relais au logo statique du header.
    opacity.value = withDelay(
      HOLD_MS + 650,
      withTiming(
        0,
        { duration: 200, easing: Easing.linear },
        (finished) => {
          'worklet';
          if (finished) runOnJS(setDone)(true);
        },
      ),
    );
  }, [ready, hasSession, targetY, targetScale, opacity, translateY, scale]);

  useEffect(() => {
    if (done) onComplete();
  }, [done, onComplete]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  if (done) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { backgroundColor: c.bg },
        overlayStyle,
      ]}>
      <Animated.View style={logoStyle}>
        <Image
          source={require('@/assets/images/aj-pronos-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    width: SPLASH_LOGO_WIDTH,
    height: SPLASH_LOGO_HEIGHT,
  },
});

// Exports pour cohérence avec le header du login
export const LOGIN_HEADER_LOGO = {
  width: HEADER_LOGO_WIDTH,
  height: HEADER_LOGO_HEIGHT,
  topPadding: HEADER_LOGO_TOP_PADDING,
};
