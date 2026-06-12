import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useNotificationPreferences } from '@/lib/use-notification-preferences';
import {
  registerForPushNotifications,
  unregisterPushToken,
} from '@/lib/push-notifications';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Sheet où l'utilisateur gère ses préférences de notifications push :
 * - Toggle master (enabled)
 * - Toggles par type (nouveaux pronos, résultats, mentions VIP, etc.)
 * - Toggles par sport
 * - Plages horaires de silence (TODO V1.1, on affiche juste l'info)
 */
export function NotificationPreferencesSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { profile } = useProfile();
  const { prefs, isLoading, update } = useNotificationPreferences();
  const [registering, setRegistering] = useState(false);

  const hasPushToken = !!profile?.expo_push_token;

  // Si le master est ON mais qu'on n'a pas de push token, on demande la
  // permission iOS automatiquement quand l'user ouvre la sheet
  useEffect(() => {
    if (visible && prefs?.enabled && !hasPushToken && !registering) {
      void requestPushPermission();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, prefs?.enabled, hasPushToken]);

  async function requestPushPermission() {
    if (!session?.user.id) return;
    setRegistering(true);
    const { error } = await registerForPushNotifications(session.user.id);
    setRegistering(false);
    if (error) {
      // On garde silencieux si c'est juste un simulator, sinon on alerte
      if (!error.includes('appareil physique')) {
        Alert.alert('Notifications', error);
      }
    }
  }

  async function onToggleMaster(value: boolean) {
    await update({ enabled: value });
    if (value && !hasPushToken) {
      await requestPushPermission();
    } else if (!value && session?.user.id) {
      // Désactivation : on retire le token pour vraiment ne plus recevoir
      await unregisterPushToken(session.user.id);
    }
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
              paddingBottom: insets.bottom + Spacing.three,
              borderTopColor: c.borderSoft,
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

          <Text style={[styles.eyebrow, { color: c.gold }]}>
            — NOTIFICATIONS
          </Text>
          <Text style={[styles.title, { color: c.text }]}>Préférences</Text>

          {isLoading ? (
            <Text style={[styles.loading, { color: c.textDim }]}>
              Chargement…
            </Text>
          ) : !prefs ? (
            <Text style={[styles.loading, { color: c.textMuted }]}>
              Impossible de charger les préférences.
            </Text>
          ) : (
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}>
              {/* Master toggle */}
              <View
                style={[
                  styles.masterBlock,
                  { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
                ]}>
                <View style={styles.masterRow}>
                  <View style={styles.masterText}>
                    <Text style={[styles.masterTitle, { color: c.text }]}>
                      Notifications activées
                    </Text>
                    <Text style={[styles.masterSub, { color: c.textMuted }]}>
                      {hasPushToken
                        ? 'Tu recevras nos notifications push.'
                        : 'L’app va te demander la permission iOS.'}
                    </Text>
                  </View>
                  <Switch
                    value={prefs.enabled}
                    onValueChange={onToggleMaster}
                    disabled={registering}
                    trackColor={{ false: c.borderFaint, true: c.gold }}
                  />
                </View>
              </View>

              {prefs.enabled ? (
                <>
                  <Section title="Types de notification">
                    <PrefRow
                      label="Nouveau prono publié"
                      hint="1h avant le coup d’envoi"
                      value={prefs.new_pronos}
                      onChange={(v) => update({ new_pronos: v })}
                    />
                    <PrefRow
                      label="Résultat de mes paris"
                      hint="Gagné, perdu ou annulé"
                      value={prefs.prono_results}
                      onChange={(v) => update({ prono_results: v })}
                    />
                    <PrefRow
                      label="Mentions @pseudo (VIP)"
                      hint="Quand quelqu’un te tag dans le salon"
                      value={prefs.vip_mentions}
                      onChange={(v) => update({ vip_mentions: v })}
                    />
                    <PrefRow
                      label="Tous les messages du salon VIP"
                      hint="Peut être bavard. Recommandé : désactivé"
                      value={prefs.vip_new_messages}
                      onChange={(v) => update({ vip_new_messages: v })}
                    />
                    <PrefRow
                      label="Récap quotidien du soir"
                      hint="Bilan des paris de la journée"
                      value={prefs.daily_recap}
                      onChange={(v) => update({ daily_recap: v })}
                    />
                  </Section>

                  <Section title="Sports suivis">
                    <PrefRow
                      label="⚽ Football"
                      value={prefs.sport_foot}
                      onChange={(v) => update({ sport_foot: v })}
                    />
                    <PrefRow
                      label="🎾 Tennis"
                      value={prefs.sport_tennis}
                      onChange={(v) => update({ sport_tennis: v })}
                    />
                  </Section>

                  <Section title="Plages de silence">
                    <View
                      style={[
                        styles.quietBlock,
                        { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
                      ]}>
                      <SymbolView
                        name="moon.fill"
                        size={16}
                        tintColor={c.gold}
                        weight="semibold"
                      />
                      <Text style={[styles.quietText, { color: c.textMuted }]}>
                        Pas de notification entre{' '}
                        <Text style={{ color: c.text, fontWeight: '700' }}>
                          {String(prefs.quiet_hours_start ?? 23).padStart(2, '0')}h
                        </Text>{' '}
                        et{' '}
                        <Text style={{ color: c.text, fontWeight: '700' }}>
                          {String(prefs.quiet_hours_end ?? 8).padStart(2, '0')}h
                        </Text>
                        . Personnalisation : bientôt.
                      </Text>
                    </View>
                  </Section>
                </>
              ) : null}
            </ScrollView>
          )}

          <BrandedButton label="Fermer" variant="ghost" onPress={onClose} />
        </Pressable>
      </Pressable>
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
        — {title.toUpperCase()}
      </Text>
      <View style={{ gap: 4 }}>{children}</View>
    </View>
  );
}

function PrefRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.prefRow,
        { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
      ]}>
      <View style={styles.prefText}>
        <Text style={[styles.prefLabel, { color: c.text }]}>{label}</Text>
        {hint ? (
          <Text style={[styles.prefHint, { color: c.textDim }]}>{hint}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.borderFaint, true: c.gold }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '90%',
    gap: Spacing.three,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loading: {
    fontSize: 13,
    fontStyle: 'italic',
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 540,
  },
  masterBlock: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  masterText: {
    flex: 1,
    gap: 2,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  masterSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  section: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  prefText: {
    flex: 1,
    gap: 1,
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  prefHint: {
    fontSize: 11,
    lineHeight: 14,
  },
  quietBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  quietText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
