import { useRef, useState } from 'react';
import {
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Carrousel snap horizontal pour les paris du jour sur l'Accueil.
 *
 * Indications visuelles que c'est swipeable :
 *  1. Compteur "1 / 3" en haut à gauche
 *  2. Label "‹ Swipe ›" en haut à droite (texte explicite)
 *  3. Dots dorés en dessous (le dot actif est plus large + or)
 *
 * Si une seule card → rendu simple sans carrousel ni dots.
 */
export function BetCarousel({ children }: { children: React.ReactNode[] }) {
  const c = useThemeColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  if (children.length === 0) return null;
  if (children.length === 1) return <>{children[0]}</>;

  function onLayout(e: LayoutChangeEvent) {
    setPageWidth(e.nativeEvent.layout.width);
  }

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / pageWidth);
    setActiveIndex(Math.max(0, Math.min(children.length - 1, idx)));
  }

  return (
    <View style={styles.wrap}>
      {/* Compteur + indication swipe */}
      <View style={styles.headerRow}>
        <Text style={[styles.counter, { color: c.textMuted }]}>
          {activeIndex + 1} / {children.length}
        </Text>
        <Text style={[styles.swipeHint, { color: c.textDim }]}>
          ‹ Swipe ›
        </Text>
      </View>

      <View onLayout={onLayout}>
        {pageWidth > 0 ? (
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            snapToInterval={pageWidth}
            decelerationRate="fast"
            scrollEventThrottle={16}
            // Padding vertical pour laisser passer les badges des cards
            // qui dépassent (GAGNÉ/PERDU en top:-8) — sinon clippés par
            // l'overflow implicite du ScrollView iOS.
            contentContainerStyle={{ paddingVertical: 10 }}>
            {children.map((child, i) => (
              <View key={i} style={{ width: pageWidth }}>
                {child}
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Dots de pagination */}
      <View style={styles.dotsRow}>
        {children.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? c.gold : c.borderSoft,
                width: i === activeIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  counter: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  swipeHint: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
