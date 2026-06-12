import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { VipMessage } from '@/types/vip-message';

/**
 * Preview du message cité affiché au-dessus de l'input quand on est
 * en train de répondre à un message (style WhatsApp).
 */
export function ReplyPreview({
  message,
  onCancel,
}: {
  message: VipMessage;
  onCancel: () => void;
}) {
  const c = useThemeColors();
  const isStaff =
    message.sender_role === 'admin' || message.sender_role === 'validator';

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.bgWarm, borderTopColor: c.goldDecorative },
      ]}>
      <View style={[styles.accent, { backgroundColor: c.gold }]} />
      <View style={styles.text}>
        <Text style={[styles.sender, { color: c.gold }]}>
          Réponse à {message.sender_display_name ?? 'anonyme'}
          {isStaff ? ' · ÉQUIPE AJ' : ''}
        </Text>
        <Text
          style={[styles.preview, { color: c.textMuted }]}
          numberOfLines={1}>
          {message.deleted_at
            ? '[Message supprimé]'
            : message.content}
        </Text>
      </View>
      <Pressable
        onPress={onCancel}
        hitSlop={10}
        style={({ pressed }) => [
          styles.cancelBtn,
          { opacity: pressed ? 0.5 : 1 },
        ]}>
        <SymbolView
          name="xmark.circle.fill"
          size={20}
          tintColor={c.textDim}
          weight="medium"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  sender: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  preview: {
    fontSize: 13,
  },
  cancelBtn: {
    padding: 4,
  },
});
