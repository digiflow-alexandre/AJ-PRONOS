import { StyleSheet, Text } from 'react-native';

import { useThemeColors } from '@/lib/use-theme-colors';
import type { VipParticipant } from '@/types/vip-message';

/**
 * Rend un texte de message en mettant en doré les @pseudo qui matchent
 * un participant connu du salon VIP.
 *
 * Pattern : "Salut @alex tu vas bien ?" → "Salut" + "@alex" (doré) + "tu vas bien ?"
 */
export function MentionText({
  content,
  participants,
  baseColor,
  baseFontStyle = 'normal',
}: {
  content: string;
  participants: VipParticipant[];
  baseColor: string;
  baseFontStyle?: 'normal' | 'italic';
}) {
  const c = useThemeColors();
  const knownPseudos = new Set(
    participants.map((p) => p.display_name.toLowerCase()),
  );

  // Split du contenu en parties : texte / mention
  const parts: { text: string; isMention: boolean }[] = [];
  const regex = /(@[a-zA-Z0-9_-]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: content.slice(lastIndex, match.index), isMention: false });
    }
    const pseudo = match[0].slice(1).toLowerCase();
    parts.push({
      text: match[0],
      isMention: knownPseudos.has(pseudo),
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ text: content.slice(lastIndex), isMention: false });
  }

  return (
    <Text style={{ color: baseColor, fontSize: 14, lineHeight: 19, fontStyle: baseFontStyle }}>
      {parts.map((p, i) =>
        p.isMention ? (
          <Text key={i} style={[styles.mention, { color: c.gold }]}>
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  mention: {
    fontWeight: '700',
  },
});
