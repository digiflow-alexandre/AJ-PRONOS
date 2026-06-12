import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { VipParticipant } from '@/types/vip-message';

const MAX_SUGGESTIONS = 5;

/**
 * Affiche une mini-liste de suggestions de pseudos quand l'utilisateur
 * tape "@..." dans l'input. Tap sur une suggestion → complète le pseudo.
 */
export function MentionAutocomplete({
  query,
  participants,
  currentUserId,
  onSelect,
}: {
  /** Texte après le @ (ex pour "@al" → query="al"). null si pas en train de taper une mention. */
  query: string | null;
  participants: VipParticipant[];
  currentUserId: string | null;
  onSelect: (displayName: string) => void;
}) {
  const c = useThemeColors();

  if (query === null) return null;

  const q = query.toLowerCase();
  const suggestions = participants
    .filter((p) => p.id !== currentUserId) // pas se mentionner soi-même
    .filter((p) => p.display_name.toLowerCase().includes(q))
    .slice(0, MAX_SUGGESTIONS);

  if (suggestions.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
      ]}>
      {suggestions.map((p) => {
        const isStaff = p.role === 'admin' || p.role === 'validator';
        return (
          <Pressable
            key={p.id}
            onPress={() => onSelect(p.display_name)}
            style={({ pressed }) => [
              styles.row,
              { opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.pseudo, { color: c.text }]}>
              @{p.display_name}
            </Text>
            {isStaff ? (
              <View
                style={[
                  styles.staffBadge,
                  { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
                ]}>
                <Text style={[styles.staffBadgeText, { color: c.gold }]}>
                  ÉQUIPE AJ
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 4,
    maxHeight: 240,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    gap: Spacing.two,
  },
  pseudo: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  staffBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
