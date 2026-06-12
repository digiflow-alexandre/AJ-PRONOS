import { Image, Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';

import { BrandedButton } from './branded-button';
import { NotificationPreferencesSheet } from './notification-preferences-sheet';

const LOGO_SIZE = 64;

export function AccountSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const { profile, isTrialActive, trialDaysLeft, deleteAccount } =
    useProfile();
  const [notifsOpen, setNotifsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const tierBadge = (() => {
    if (isTrialActive) return `Essai gratuit · J-${trialDaysLeft}`;
    if (profile?.tier === 'starter') return 'Abonné Starter';
    if (profile?.tier === 'pro') return 'Abonné Pro';
    if (profile?.tier === 'vip') return 'Abonné VIP';
    return 'Aucun abonnement';
  })();

  function navTo(path: '/stats' | '/carnet' | '/(app)/subscribe' | '/legal') {
    onClose();
    // Avant de naviguer, dismiss toutes les modals actives pour éviter
    // l'empilement (genre : depuis /stats → ouvrir account-sheet → cliquer
    // /carnet empilerait carnet par-dessus stats).
    setTimeout(() => {
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.push(path);
    }, 80);
  }

  async function onSignOut() {
    onClose();
    await signOut();
  }

  function onContactSupport() {
    Linking.openURL(
      'mailto:contact@ajpronos.fr?subject=Support%20AJ%20Pronos',
    );
  }

  function confirmDelete() {
    // Double confirm requis pour conformité ANJ + best practice UX
    Alert.alert(
      'Supprimer ton compte ?',
      'Ton profil sera désactivé immédiatement. Toutes tes données personnelles seront purgées sous 30 jours conformément au RGPD. Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Es-tu vraiment sûr ?',
              'Une dernière confirmation. Aucun retour possible après ça.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Confirmer la suppression',
                  style: 'destructive',
                  onPress: doDelete,
                },
              ],
            );
          },
        },
      ],
    );
  }

  async function doDelete() {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      Alert.alert('Suppression échouée', error);
      return;
    }
    onClose();
    await signOut();
  }

  const userPseudo = profile?.display_name
    ? `@${profile.display_name}`
    : session?.user.email?.split('@')[0]?.toUpperCase() ?? 'Compte';

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
              backgroundColor: c.bg,
              paddingBottom: insets.bottom + Spacing.three,
              borderTopColor: c.borderSoft,
            },
          ]}>
          {/* BG image stade + logo AJ doré en filigrane */}
          <ExpoImage
            source={require('@/assets/images/bg-vip-salon.png')}
            style={styles.bgImage}
            contentFit="cover"
          />
          <View style={styles.bgOverlay} pointerEvents="none" />

          <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}>
            {/* ===== HEADER : logo + bloc texte + actions ===== */}
            <View style={styles.headerRow}>
              <Image
                source={require('@/assets/images/aj-pronos-logo.png')}
                style={styles.headerLogo}
                contentFit="contain"
              />
              <View style={styles.headerCenter}>
                <Text style={[styles.headerEyebrow, { color: c.gold }]}>
                  COMPTE
                </Text>
                <Text
                  style={[styles.headerPseudo, { color: c.gold }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}>
                  {userPseudo}
                </Text>
                <Text
                  style={[styles.headerEmail, { color: c.textMuted }]}
                  numberOfLines={1}>
                  {session?.user.email}
                </Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => setNotifsOpen(true)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    {
                      backgroundColor: c.bgElevated,
                      borderColor: c.borderSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="bell"
                    size={16}
                    tintColor={c.text}
                    weight="medium"
                  />
                </Pressable>
                <Pressable
                  onPress={() => navTo('/legal')}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.headerIconBtn,
                    {
                      backgroundColor: c.bgElevated,
                      borderColor: c.borderSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="gearshape"
                    size={16}
                    tintColor={c.text}
                    weight="medium"
                  />
                </Pressable>
              </View>
            </View>

            {/* Pill tier */}
            <View
              style={[
                styles.tierBadge,
                { borderColor: c.gold },
              ]}>
              <SymbolView
                name="crown.fill"
                size={11}
                tintColor={c.gold}
                weight="semibold"
              />
              <Text style={[styles.tierBadgeText, { color: c.text }]}>
                {tierBadge}
              </Text>
            </View>

            <View style={[styles.headerDivider, { backgroundColor: c.borderFaint }]} />

            {/* ===== SECTIONS ===== */}
            <Section title="Mon profil">
              <Row
                label="Mon carnet"
                hint="Tes paris joués, ROI réel"
                icon="creditcard"
                onPress={() => navTo('/carnet')}
              />
              <Row
                label="Mes statistiques"
                hint="Bilan AJ Pronos complet"
                icon="chart.bar"
                onPress={() => navTo('/stats')}
              />
            </Section>

            <Section title="Abonnement">
              <Row
                label="Voir mon pack"
                hint="Changer, résilier"
                icon="gift"
                onPress={() => navTo('/(app)/subscribe')}
              />
            </Section>

            <Section title="Préférences">
              <Row
                label="Notifications"
                hint="Types, sports, plages de silence"
                icon="bell"
                onPress={() => setNotifsOpen(true)}
              />
              <Row
                label="Informations légales"
                hint="CGV, confidentialité, jeu responsable"
                icon="doc.text"
                onPress={() => navTo('/legal')}
              />
            </Section>

            <Section title="Support">
              <Row
                label="Nous contacter"
                hint="contact@ajpronos.fr"
                icon="envelope"
                onPress={onContactSupport}
              />
            </Section>

            {/* ===== Bouton déconnexion gold + suppression discrète ===== */}
            <View style={styles.dangerBlock}>
              <BrandedButton
                label="Se déconnecter"
                variant="gold"
                onPress={onSignOut}
              />
              <Pressable
                onPress={confirmDelete}
                disabled={deleting}
                hitSlop={6}
                style={({ pressed }) => ({
                  opacity: pressed || deleting ? 0.5 : 1,
                  alignSelf: 'center',
                  paddingVertical: Spacing.two,
                })}>
                <Text style={[styles.deleteText, { color: c.danger }]}>
                  {deleting ? 'Suppression…' : 'Supprimer mon compte'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>

      <NotificationPreferencesSheet
        visible={notifsOpen}
        onClose={() => setNotifsOpen(false)}
      />
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.gold }]}>
        — {title.toUpperCase()} —
      </Text>
      <View style={styles.sectionRows}>{children}</View>
    </View>
  );
}

function Row({
  label,
  hint,
  icon,
  onPress,
}: {
  label: string;
  hint?: string;
  icon: string;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.borderSoft,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <View
        style={[
          styles.rowIconWrap,
          { backgroundColor: 'rgba(232,201,90,0.12)' },
        ]}>
        <SymbolView
          name={icon as never}
          size={16}
          tintColor={c.gold}
          weight="semibold"
        />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.rowHint, { color: c.textMuted }]}>{hint}</Text>
        ) : null}
      </View>
      <SymbolView
        name="chevron.right"
        size={14}
        tintColor={c.textDim}
        weight="medium"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.72)',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  // === Header ===
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerLogo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  headerCenter: {
    flex: 1,
    gap: 2,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  headerPseudo: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerEmail: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === Tier badge ===
  tierBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1.2,
    marginTop: Spacing.three,
  },
  tierBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.four,
  },
  // === Sections ===
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  sectionRows: {
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowHint: {
    fontSize: 12,
  },
  // === Danger ===
  dangerBlock: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
