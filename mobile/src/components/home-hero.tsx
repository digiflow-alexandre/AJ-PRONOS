import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

import { AccountSheet } from './account-sheet';
import { NotificationsSheet } from './notifications-sheet';

const LOGO_HEIGHT = 40;
const LOGO_WIDTH = (LOGO_HEIGHT * 928) / 1152;

/**
 * Top bar sticky de l'Accueil : logo + cloche notifs + bouton profil.
 * Positionnée en absolute par le screen pour rester visible au scroll.
 * Fond semi-transparent noir + blur léger pour rester lisible par-dessus
 * l'image stade.
 */
export function HomeStickyTopBar() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifsOpen, setNotifsOpen] = useState(false);

  return (
    <>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 4,
            backgroundColor: c.bg,
            borderBottomColor: 'rgba(250,250,247,0.10)',
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

/**
 * Bloc de salutation de l'Accueil ("Bonsoir, ALEX." + badge trial).
 * Rendu APRÈS la sticky top bar dans la ScrollView, donc avec un padding
 * top suffisant pour ne pas être caché.
 */
export function HomeHero({
  greeting,
  userDisplay,
  trialChip,
}: {
  greeting: string;
  userDisplay: string;
  /** Composant chip d'état trial (Essai · J-N, Essai terminé, ou null). */
  trialChip: React.ReactNode;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.greetingBlock}>
      <Text style={[styles.greetingLine1, { color: c.text }]}>
        {greeting},
      </Text>
      <Text
        style={[styles.greetingLine2, { color: c.gold }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}>
        {userDisplay.toUpperCase()}.
      </Text>
      {trialChip ? <View style={styles.chipWrap}>{trialChip}</View> : null}
    </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  greetingBlock: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
    gap: 4,
    alignItems: 'center',
  },
  greetingLine1: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  greetingLine2: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1.2,
    lineHeight: 52,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  chipWrap: {
    marginTop: Spacing.three,
  },
});
