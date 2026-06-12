import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Affiche un résumé statistique factuel généré à partir des stats DB.
 *
 * ⚠️ Convention UX cruciale : labellisé clairement "RÉSUMÉ STATISTIQUE"
 * avec icône bar chart pour qu'aucun abonné ne confonde ça avec l'analyse
 * rédigée par Julien (laquelle est dans le champ `reasoning`).
 *
 * Si pas de texte (= pas de stats dispo), renvoie null (pas de bloc vide).
 */
export function StatSummaryBlock({ text }: { text: string | null }) {
  const c = useThemeColors();
  if (!text) return null;
  return (
    <View
      style={[
        styles.block,
        {
          backgroundColor: c.bgDeeper,
          borderColor: c.borderFaint,
        },
      ]}>
      <View style={styles.headerRow}>
        <SymbolView
          name="chart.bar"
          size={14}
          tintColor={c.textMuted}
          weight="semibold"
        />
        <Text style={[styles.label, { color: c.textMuted }]}>
          — RÉSUMÉ STATISTIQUE
        </Text>
      </View>
      <Text style={[styles.text, { color: c.text }]}>{text}</Text>
      <Text style={[styles.disclaimer, { color: c.textDim }]}>
        Généré automatiquement depuis les données API-Football. Ne remplace
        pas l'analyse de Julien.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  text: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
    marginTop: 2,
  },
});
