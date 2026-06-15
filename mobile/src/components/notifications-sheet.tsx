/**
 * NotificationsSheet — Feed de notifications style Instagram.
 *
 * Full screen modal (slide from bottom). Liste verticale groupée par
 * section temporelle (Aujourd'hui / Cette semaine / Plus ancien).
 *
 * Source de données : useNotificationsFeed (agrégation live depuis
 * published_bets + vip_messages, filtrée par pack utilisateur).
 */

import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import {
  useNotificationsFeed,
  type NotifType,
  type NotificationItem,
} from '@/lib/use-notifications-feed';
import { useThemeColors } from '@/lib/use-theme-colors';

export function NotificationsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { items, isLoading } = useNotificationsFeed();

  // Groupage par section temporelle
  const sections = useMemo(() => groupBySection(items), [items]);

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.borderFaint }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Notifications</Text>
          <Pressable
            onPress={onClose}
            hitSlop={10}
            style={({ pressed }) => [
              styles.closeBtn,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.borderSoft,
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <SymbolView name="xmark" size={14} tintColor={c.text} weight="bold" />
          </Pressable>
        </View>

        {/* Body */}
        {isLoading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={c.gold} />
          </View>
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <ScrollView
            contentContainerStyle={{
              paddingBottom: insets.bottom + Spacing.five,
            }}
            showsVerticalScrollIndicator={false}>
            {sections.map((section) =>
              section.items.length === 0 ? null : (
                <View key={section.key}>
                  <Text style={[styles.sectionTitle, { color: c.textMuted }]}>
                    {section.label}
                  </Text>
                  {section.items.map((item) => (
                    <NotificationRow
                      key={item.id}
                      item={item}
                      onPress={() => {
                        if (item.target) {
                          onClose();
                          // setTimeout pour laisser le modal se fermer avant nav
                          setTimeout(() => router.push(item.target as never), 100);
                        }
                      }}
                    />
                  ))}
                </View>
              ),
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ============================================================
// Sections temporelles
// ============================================================

type Section = {
  key: string;
  label: string;
  items: NotificationItem[];
};

function groupBySection(items: NotificationItem[]): Section[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const todayKey = now.getTime();
  const sevenDaysAgo = todayKey - 7 * 24 * 3600 * 1000;

  const today: NotificationItem[] = [];
  const week: NotificationItem[] = [];
  const older: NotificationItem[] = [];

  for (const item of items) {
    const itemDay = new Date(item.createdAt);
    itemDay.setHours(0, 0, 0, 0);
    const t = itemDay.getTime();
    if (t >= todayKey) today.push(item);
    else if (t >= sevenDaysAgo) week.push(item);
    else older.push(item);
  }

  return [
    { key: 'today', label: "AUJOURD'HUI", items: today },
    { key: 'week', label: 'CETTE SEMAINE', items: week },
    { key: 'older', label: 'PLUS ANCIEN', items: older },
  ];
}

// ============================================================
// Row (Instagram-like)
// ============================================================

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const c = useThemeColors();
  const accent = colorFor(item.type, c.gold);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: pressed ? c.bgElevated : 'transparent' },
      ]}>
      {/* Pastille icône colorée */}
      <View style={[styles.iconWrap, { backgroundColor: accent.bg, borderColor: accent.border }]}>
        <Text style={[styles.iconEmoji, { color: accent.color }]}>
          {iconFor(item.type)}
        </Text>
      </View>

      {/* Texte */}
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.rowBody, { color: c.textMuted }]} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={[styles.rowTime, { color: c.textDim }]}>
          {relativeTime(item.createdAt)}
        </Text>
      </View>

      {/* Chevron */}
      {item.target ? (
        <SymbolView name="chevron.right" size={12} tintColor={c.textDim} weight="medium" />
      ) : null}
    </Pressable>
  );
}

function iconFor(type: NotifType): string {
  switch (type) {
    case 'new_prono':
      return '🔥';
    case 'bet_won':
      return '🏆';
    case 'bet_lost':
      return '❌';
    case 'vip_message':
      return '💎';
    case 'carnet_reminder':
      return '📒';
    default:
      return '🔔';
  }
}

function colorFor(type: NotifType, gold: string): {
  bg: string;
  border: string;
  color: string;
} {
  if (type === 'bet_won')
    return { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.3)', color: '#34d399' };
  if (type === 'bet_lost')
    return { bg: 'rgba(248,113,113,0.15)', border: 'rgba(248,113,113,0.3)', color: '#f87171' };
  if (type === 'vip_message')
    return { bg: 'rgba(96,165,250,0.15)', border: 'rgba(96,165,250,0.3)', color: '#60a5fa' };
  if (type === 'carnet_reminder')
    return { bg: 'rgba(250,250,247,0.10)', border: 'rgba(250,250,247,0.2)', color: '#fafaf7' };
  // new_prono (default)
  return { bg: 'rgba(184,148,31,0.18)', border: 'rgba(184,148,31,0.35)', color: gold };
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'à l’instant';
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ============================================================
// Empty state
// ============================================================

function EmptyState() {
  const c = useThemeColors();
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: 'rgba(184,148,31,0.12)', borderColor: 'rgba(184,148,31,0.3)' }]}>
        <SymbolView name="bell" size={28} tintColor={c.gold} weight="medium" />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>
        Pas de notifications
      </Text>
      <Text style={[styles.emptyBody, { color: c.textMuted }]}>
        Tu seras notifié à chaque nouveau prono publié pour ton pack, et
        quand un de tes paris est résolu.
      </Text>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: {
    fontSize: 18,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowBody: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  rowTime: {
    fontSize: 11,
    marginTop: 2,
  },
  // Empty
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyBody: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
});
