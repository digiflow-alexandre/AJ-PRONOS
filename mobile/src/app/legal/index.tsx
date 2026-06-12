import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEGAL_DOCUMENTS_LIST } from '@/constants/legal-content';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function LegalIndexScreen() {
  const c = useThemeColors();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: c.bg }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}>
      <View style={styles.headerBlock}>
        <Text style={[styles.eyebrow, { color: c.gold }]}>— LÉGAL</Text>
        <Text style={[styles.title, { color: c.text }]}>
          Informations légales
        </Text>
        <Text style={[styles.lead, { color: c.textMuted }]}>
          Mentions légales, conditions de vente, protection des données et jeu
          responsable. Ces documents sont également disponibles en ligne.
        </Text>
      </View>

      <View style={styles.cards}>
        {LEGAL_DOCUMENTS_LIST.map((doc) => (
          <Pressable
            key={doc.slug}
            onPress={() =>
              router.push({
                pathname: '/legal/[slug]',
                params: { slug: doc.slug },
              })
            }
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.borderSoft,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <View style={styles.cardLeft}>
              <Text style={[styles.cardEyebrow, { color: c.gold }]}>
                — {doc.eyebrow.toUpperCase()}
              </Text>
              <Text style={[styles.cardTitle, { color: c.text }]}>
                {doc.title}
              </Text>
              <Text
                style={[styles.cardLead, { color: c.textMuted }]}
                numberOfLines={2}>
                {doc.lead}
              </Text>
            </View>
            <SymbolView
              name="chevron.right"
              size={16}
              tintColor={c.textDim}
              weight="medium"
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => Linking.openURL('https://www.joueurs-info-service.fr')}
        style={({ pressed }) => [
          styles.helpBanner,
          {
            backgroundColor: c.bgWarm,
            borderColor: c.goldDecorative,
            opacity: pressed ? 0.85 : 1,
          },
        ]}>
        <Text style={[styles.helpEyebrow, { color: c.gold }]}>
          — BESOIN D’AIDE ?
        </Text>
        <Text style={[styles.helpTitle, { color: c.text }]}>
          Joueurs Info Service — 09 74 75 13 13
        </Text>
        <Text style={[styles.helpBody, { color: c.textMuted }]}>
          Anonyme, gratuit, 7j/7 de 8h à 2h. Toute personne concernée par le
          jeu peut être écoutée et accompagnée.
        </Text>
        <Text style={[styles.helpCta, { color: c.gold }]}>
          joueurs-info-service.fr →
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  headerBlock: {
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
    fontSize: 14,
    lineHeight: 20,
  },
  cards: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLeft: {
    flex: 1,
    gap: 4,
  },
  cardEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardLead: {
    fontSize: 13,
    lineHeight: 18,
  },
  helpBanner: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  helpEyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  helpBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  helpCta: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
});
