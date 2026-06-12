import { Modal, Pressable, StyleSheet, Text } from 'react-native';

import { BrandedButton } from '@/components/branded-button';
import type { Pack } from '@/constants/packs';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Modal "Liste d'attente" affichée quand l'utilisateur clique sur un pack
 * Pro ou VIP tant que RevenueCat / Apple IAP ne sont pas encore branchés.
 *
 * À retirer / remplacer par le vrai checkout Apple IAP quand le chantier
 * RevenueCat (#69) sera livré.
 */
export function WaitlistModal({
  pack,
  onClose,
}: {
  pack: Pack | null;
  onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <Modal
      visible={!!pack}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>
            — LISTE D’ATTENTE
          </Text>
          <Text style={[styles.title, { color: c.text }]}>
            Ouverture imminente.
          </Text>
          <Text style={[styles.body, { color: c.textMuted }]}>
            Le pack{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>
              {pack?.name}
            </Text>{' '}
            sera dispo à l’abonnement dans quelques jours, le temps qu’on
            finalise les paiements côté App Store. Tu seras prévenu par
            notification dès que c’est ouvert.
          </Text>
          <BrandedButton label="Compris" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
});
