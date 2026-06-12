import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import type { LegalBlock, LegalDocument } from '@/constants/legal-content';
import { useThemeColors } from '@/lib/use-theme-colors';

export function LegalDocumentView({ doc }: { doc: LegalDocument }) {
  const c = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: c.gold }]}>
          — {doc.eyebrow.toUpperCase()}
        </Text>
        <Text style={[styles.title, { color: c.text }]}>{doc.title}</Text>
        <Text style={[styles.lead, { color: c.textMuted }]}>{doc.lead}</Text>
      </View>

      <View style={styles.sections}>
        {doc.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              {section.title}
            </Text>
            <View style={styles.blocks}>
              {section.blocks.map((block, i) => (
                <BlockRenderer key={i} block={block} />
              ))}
            </View>
          </View>
        ))}
      </View>

      <Text style={[styles.metaUpdate, { color: c.textDim }]}>
        Dernière mise à jour : {doc.lastUpdate}.
      </Text>
    </View>
  );
}

function BlockRenderer({ block }: { block: LegalBlock }) {
  const c = useThemeColors();

  switch (block.kind) {
    case 'p':
      return <Text style={[styles.p, { color: c.textMuted }]}>{block.text}</Text>;

    case 'strong-p':
      return (
        <Text style={[styles.strongP, { color: c.text }]}>{block.text}</Text>
      );

    case 'h3':
      return (
        <Text style={[styles.h3, { color: c.text }]}>{block.text}</Text>
      );

    case 'ul':
      return (
        <View style={styles.ul}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.li}>
              <Text style={[styles.bullet, { color: c.gold }]}>•</Text>
              <Text style={[styles.liText, { color: c.textMuted }]}>{item}</Text>
            </View>
          ))}
        </View>
      );

    case 'link':
      return (
        <Pressable
          onPress={() => Linking.openURL(block.url)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.linkRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.linkText, { color: c.gold }]}>
            {block.label} →
          </Text>
        </Pressable>
      );

    case 'phone':
      return (
        <Pressable
          onPress={() => Linking.openURL(`tel:${block.tel}`)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.linkRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.linkLabel, { color: c.textMuted }]}>
            {block.label} :
          </Text>
          <Text style={[styles.linkText, { color: c.gold }]}>
            {formatPhone(block.tel)}
          </Text>
        </Pressable>
      );

    case 'email':
      return (
        <Pressable
          onPress={() => Linking.openURL(`mailto:${block.email}`)}
          hitSlop={6}
          style={({ pressed }) => [
            styles.linkRow,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.linkLabel, { color: c.textMuted }]}>
            {block.label} :
          </Text>
          <Text style={[styles.linkText, { color: c.gold }]}>{block.email}</Text>
        </Pressable>
      );
  }
}

function formatPhone(raw: string): string {
  // 0974751313 → 09 74 75 13 13
  return raw.replace(/(\d{2})(?=\d)/g, '$1 ');
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
  },
  sections: {
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  blocks: {
    gap: Spacing.two,
  },
  p: {
    fontSize: 14,
    lineHeight: 21,
  },
  strongP: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  h3: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: Spacing.one,
  },
  ul: {
    gap: 6,
    paddingLeft: Spacing.one,
  },
  li: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  liText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
  },
  linkRow: {
    paddingVertical: 4,
  },
  linkLabel: {
    fontSize: 13,
    lineHeight: 18,
  },
  linkText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  metaUpdate: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: Spacing.two,
  },
});
