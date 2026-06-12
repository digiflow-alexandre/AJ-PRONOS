import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

import { AccountSheet } from './account-sheet';
import { NotificationsSheet } from './notifications-sheet';

// Logo natif 928×1152 (portrait). Taille header app (plus petit que le login).
// On part d'une hauteur cible pour rester compact dans la barre.
const LOGO_HEIGHT = 64;
const LOGO_WIDTH = (LOGO_HEIGHT * 928) / 1152;

export function BrandHeader() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  return (
    <>
      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + Spacing.two,
            backgroundColor: c.bg,
            borderBottomColor: c.borderFaint,
          },
        ]}>
        <Image
          source={require('@/assets/images/aj-pronos-logo.png')}
          style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}
          contentFit="contain"
        />

        <View style={styles.actions}>
          <IconButton
            symbol="bell"
            onPress={() => setNotifsOpen(true)}
            color={c.text}
          />
          <IconButton
            symbol="person.crop.circle"
            onPress={() => setAccountOpen(true)}
            color={c.text}
          />
        </View>
      </View>

      <NotificationsSheet
        visible={notifsOpen}
        onClose={() => setNotifsOpen(false)}
      />
      <AccountSheet
        visible={accountOpen}
        onClose={() => setAccountOpen(false)}
      />
    </>
  );
}

function IconButton({
  symbol,
  onPress,
  color,
}: {
  symbol: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.iconBtn,
        { opacity: pressed ? 0.5 : 1 },
      ]}>
      <SymbolView
        name={symbol as never}
        size={24}
        tintColor={color}
        weight="regular"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
