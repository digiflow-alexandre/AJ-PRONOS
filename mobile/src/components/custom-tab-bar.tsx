import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { GlassView } from 'expo-glass-effect';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#E6B450';
const GOLD_PILL_BG = 'rgba(230,180,80,0.12)';
const GOLD_PILL_BORDER = 'rgba(230,180,80,0.45)';
const INACTIVE = '#8A8A8E';
const FALLBACK_BG = 'rgba(20,20,22,0.85)';

/** Mapping name de route → SF Symbol (icone par défaut + version "fill"). */
const ROUTE_ICON: Record<
  string,
  { default: string; selected: string; label: string }
> = {
  index: { default: 'house', selected: 'house.fill', label: 'Accueil' },
  pronos: {
    default: 'soccerball',
    selected: 'soccerball.inverse',
    label: 'Pronos',
  },
  subscribe: { default: 'crown', selected: 'crown.fill', label: 'Abonnement' },
  vip: { default: 'crown', selected: 'crown.fill', label: 'Salon VIP' },
  admin: { default: 'shield', selected: 'shield.fill', label: 'Admin' },
};

/**
 * Tab bar custom AJ Pronos — pill flottante, fond verre dépoli sombre,
 * onglet actif en pill dorée avec glow. Remplace NativeTabs pour avoir
 * un contrôle 100% du rendu (iOS Liquid Glass interférait trop).
 */
export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { bottom: Math.max(insets.bottom / 2, 8) },
      ]}
      pointerEvents="box-none">
      <GlassView
        glassEffectStyle="regular"
        tintColor="rgba(20,20,22,0.85)"
        style={styles.bar}>
        <View style={[styles.barInner, { backgroundColor: FALLBACK_BG }]}>
          {state.routes.map((route, index) => {
            const cfg = ROUTE_ICON[route.name];
            if (!cfg) return null;

            const isFocused = state.index === index;
            const { options } = descriptors[route.key];
            // Respecte les triggers cachés (staff/vip) en regardant tabBarButton
            // null ou tabBarItemStyle.display='none'.
            if ((options as { tabBarButton?: unknown }).tabBarButton === null) {
              return null;
            }
            const itemStyle = options.tabBarItemStyle as
              | { display?: 'none' | 'flex' }
              | undefined;
            if (itemStyle?.display === 'none') return null;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={cfg.label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={({ pressed }) => [
                  styles.tabBtn,
                  isFocused && styles.tabBtnActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}>
                <SymbolView
                  name={(isFocused ? cfg.selected : cfg.default) as never}
                  size={20}
                  tintColor={isFocused ? GOLD : INACTIVE}
                  weight={isFocused ? 'semibold' : 'regular'}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? GOLD : INACTIVE },
                  ]}
                  numberOfLines={1}>
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  bar: {
    borderRadius: 28,
    overflow: 'hidden',
    // Bordure dorée translucide autour de la barre.
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(230,180,80,0.25)',
    // Glow doré subtil autour de la barre (iOS).
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 12,
      },
    }),
  },
  barInner: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: GOLD_PILL_BG,
    borderColor: GOLD_PILL_BORDER,
    // Glow doré autour de l'onglet actif.
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
