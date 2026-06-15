import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';
import { getRecapJulienQuote, type RecapData } from '@/lib/recap';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { AnyBet } from '@/types/prono';

const MAX_BETS_DISPLAYED = 5;
const RING_SIZE = 200;
const RING_STROKE = 4;

export function DailyRecapModal({
  visible,
  data,
  onClose,
}: {
  visible: boolean;
  data: RecapData;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const router = useRouter();

  const quote = getRecapJulienQuote(data);
  const displayedBets = data.resolvedBets.slice(0, MAX_BETS_DISPLAYED);
  const extraCount = data.resolvedBets.length - displayedBets.length;

  function openAllPronos() {
    onClose();
    router.push('/(app)/pronos');
  }

  // Calcul de l'arc circulaire : portion de cercle = wins / total
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const ratio = data.total > 0 ? data.wins / data.total : 0;
  const dashOffset = circumference * (1 - ratio);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.card,
            { backgroundColor: c.bgElevated, borderColor: c.gold },
          ]}>
          {/* Header avec close */}
          <View style={styles.header}>
            <Text style={[styles.eyebrow, { color: c.gold }]}>
              — DEPUIS TA DERNIÈRE VISITE
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: c.bgDeeper,
                  borderColor: c.borderSoft,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <SymbolView
                name="xmark"
                size={14}
                tintColor={c.text}
                weight="bold"
              />
            </Pressable>
          </View>

          {/* Big ratio avec cercle de progression doré */}
          <View style={styles.ratioBlock}>
            <View style={styles.ringWrap}>
              <Svg
                width={RING_SIZE}
                height={RING_SIZE}
                style={styles.ringSvg}>
                {/* Cercle de fond très discret */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke={c.borderFaint}
                  strokeWidth={RING_STROKE}
                  fill="transparent"
                />
                {/* Arc de progression doré */}
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={radius}
                  stroke={c.gold}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  fill="transparent"
                  // Démarre en haut (-90°)
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
              <View style={styles.ringInner}>
                <Text style={[styles.ratioNumber, { color: c.text }]}>
                  {data.wins}
                  <Text style={{ color: c.textDim, fontWeight: '500' }}>
                    /{data.total}
                  </Text>
                </Text>
                <Text style={[styles.ratioLabel, { color: c.textMuted }]}>
                  {data.total > 1 ? 'pronostics gagnés' : 'pronostic gagné'}
                </Text>
              </View>
            </View>
            {data.voids > 0 ? (
              <Text style={[styles.voidsLine, { color: c.textDim }]}>
                {data.voids} annulé{data.voids > 1 ? 's' : ''}
              </Text>
            ) : null}
          </View>

          {/* Liste compacte */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ gap: 6 }}
            showsVerticalScrollIndicator={false}>
            {displayedBets.map((r) => (
              <RecapRow key={r.bet.id} bet={r.bet} />
            ))}
            {extraCount > 0 ? (
              <Text style={[styles.extraText, { color: c.textDim }]}>
                + {extraCount} autre{extraCount > 1 ? 's' : ''}
              </Text>
            ) : null}
          </ScrollView>

          {/* Phrase Julien avec logo AJ */}
          <View
            style={[
              styles.quoteBlock,
              { backgroundColor: c.bgDeeper, borderColor: c.gold },
            ]}>
            <View style={styles.quoteHeader}>
              <SymbolView
                name="quote.opening"
                size={16}
                tintColor={c.gold}
                weight="bold"
              />
              <Text style={[styles.quoteLabel, { color: c.gold }]}>
                — JULIEN
              </Text>
              <View style={{ flex: 1 }} />
              <ExpoImage
                source={require('@/assets/images/aj-pronos-logo.png')}
                style={styles.quoteLogo}
                contentFit="contain"
              />
            </View>
            <Text style={[styles.quoteText, { color: c.text }]}>
              « {quote} »
            </Text>
          </View>

          {/* CTA principal doré */}
          <Pressable
            onPress={openAllPronos}
            style={({ pressed }) => [
              styles.ctaPrimary,
              {
                backgroundColor: c.gold,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text style={[styles.ctaPrimaryText, { color: '#0A0A0A' }]}>
              Voir les détails
            </Text>
            <SymbolView
              name="arrow.right"
              size={16}
              tintColor="#0A0A0A"
              weight="bold"
            />
          </Pressable>

          {/* CTA secondaire : Fermer (text-only or) */}
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.ctaGhost,
              { opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.ctaGhostText, { color: c.gold }]}>
              Fermer
            </Text>
          </Pressable>

          {/* Disclaimer ANJ */}
          <Text style={[styles.disclaimer, { color: c.textDim }]}>
            Performance passée, ne préjuge pas du futur.{'\n'}
            +18 — les paris comportent des risques.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function RecapRow({ bet }: { bet: AnyBet }) {
  const c = useThemeColors();

  const isWin = bet.result === 'win';
  const isVoid = bet.result === 'void';
  const accent = isVoid ? c.textDim : isWin ? c.success : c.danger;
  const label = isVoid ? 'ANNULÉ' : isWin ? 'GAGNÉ' : 'PERDU';
  const icon = isVoid ? 'minus.circle' : isWin ? 'checkmark' : 'xmark';

  const title = bet.type === 'single'
    ? `${bet.teamHome} - ${bet.teamAway}`
    : `Combiné ${bet.selections.length} sélections`;

  const odd = bet.type === 'single'
    ? bet.odd.toFixed(2)
    : bet.combinationOdd.toFixed(2);

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
      ]}>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: accent + '22', borderColor: accent },
        ]}>
        <SymbolView
          name={icon as never}
          size={11}
          tintColor={accent}
          weight="bold"
        />
      </View>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rowSub, { color: c.textMuted }]}>
          cote {odd}
        </Text>
      </View>
      <Text style={[styles.rowStatus, { color: accent }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === Cercle de progression ===
  ratioBlock: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.two,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  ratioNumber: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 60,
  },
  ratioLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  voidsLine: {
    fontSize: 12,
    fontWeight: '500',
  },
  // === Liste ===
  // MAX_BETS_DISPLAYED = 5. Une row = ~68px (padding 10 + contenu + bord)
  // + gap 6 ⇒ 5 rows = 340-360px. 380 = marge confort pour montrer les 5
  // rows en entier sans demi-coupe en bas. Au-delà : scroll (mais comme
  // displayed est cappé à 5, ça ne devrait pas arriver).
  list: {
    maxHeight: 380,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLeft: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  rowStatus: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  extraText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  // === Quote Julien ===
  quoteBlock: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    gap: 6,
  },
  quoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quoteLabel: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '800',
  },
  quoteLogo: {
    width: 28,
    height: 28,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
    fontWeight: '500',
  },
  // === CTAs ===
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
  },
  ctaPrimaryText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ctaGhost: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  ctaGhostText: {
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
