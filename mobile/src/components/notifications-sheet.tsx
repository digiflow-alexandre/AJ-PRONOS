import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

import { BrandedButton } from './branded-button';

export function NotificationsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

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
          <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

          <Text style={[styles.eyebrow, { color: c.gold }]}>— NOTIFICATIONS</Text>
          <Text style={[styles.title, { color: c.text }]}>
            Rien pour l’instant.
          </Text>
          <Text style={[styles.body, { color: c.textMuted }]}>
            Tu seras notifié à chaque nouveau prono publié, et lors des grandes
            étapes de ton abonnement. Pense à autoriser les notifications dans
            les paramètres iOS quand l’app te les demandera.
          </Text>

          <BrandedButton label="Fermer" variant="ghost" onPress={onClose} />
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
    gap: Spacing.three,
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
