import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { LegalDocumentView } from '@/components/legal-document-view';
import { LEGAL_DOCUMENTS } from '@/constants/legal-content';
import type { LegalDocument } from '@/constants/legal-content';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function LegalDocScreen() {
  const c = useThemeColors();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const navigation = useNavigation();

  const doc =
    slug && slug in LEGAL_DOCUMENTS
      ? LEGAL_DOCUMENTS[slug as LegalDocument['slug']]
      : null;

  useLayoutEffect(() => {
    if (doc) {
      navigation.setOptions({ title: doc.title });
    }
  }, [doc, navigation]);

  if (!doc) {
    return (
      <View style={[styles.fallback, { backgroundColor: c.bg }]}>
        <Text style={[styles.fallbackText, { color: c.textMuted }]}>
          Document introuvable.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <LegalDocumentView doc={doc} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  fallbackText: {
    fontSize: 14,
  },
});
