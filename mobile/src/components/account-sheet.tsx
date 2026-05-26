import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';

import { BrandedButton } from './branded-button';

export function AccountSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { profile, isTrialActive, trialDaysLeft } = useProfile();

  const tierBadge = (() => {
    if (isTrialActive) return `Essai gratuit · J-${trialDaysLeft}`;
    if (profile?.tier === 'starter') return 'Abonné Starter';
    if (profile?.tier === 'pro') return 'Abonné Pro';
    if (profile?.tier === 'vip') return 'Abonné VIP';
    return 'Aucun abonnement';
  })();

  async function onSignOut() {
    onClose();
    await signOut();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              backgroundColor: c.bgElevated,
              paddingBottom: insets.bottom + Spacing.four,
              borderTopColor: c.borderSoft,
            },
          ]}>
          {/* Poignée */}
          <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

          <Text style={[styles.eyebrow, { color: c.gold }]}>— COMPTE</Text>

          <View style={styles.headerBlock}>
            <Text style={[styles.email, { color: c.text }]} numberOfLines={1}>
              {session?.user.email}
            </Text>
            <View
              style={[
                styles.tierBadge,
                {
                  backgroundColor: c.bgWarm,
                  borderColor: c.goldDecorative,
                },
              ]}>
              <Text style={[styles.tierBadgeText, { color: c.text }]}>
                {tierBadge}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <BrandedButton
              label="Paramètres"
              variant="ghost"
              onPress={() => {
                /* TODO : écran paramètres */
              }}
              disabled
            />
            <BrandedButton
              label="Se déconnecter"
              variant="primary"
              onPress={onSignOut}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.four,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  headerBlock: {
    gap: Spacing.two,
  },
  email: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  actions: {
    gap: Spacing.two,
  },
});
