import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import {
  computeGlobalStats,
  computeStatsByMonth,
  computeStatsBySport,
  type GlobalStats,
} from '@/lib/stats-aggregator';
import { useAllBets } from '@/lib/use-all-bets';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function StatsScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  // Source unique : fixtures + paris publiés en DB. Les stats se recalculent
  // automatiquement quand Julien publie/résout un pari.
  const { bets } = useAllBets();

  const globalStats = useMemo(() => computeGlobalStats(bets), [bets]);
  const footStats = useMemo(() => computeStatsBySport(bets, 'foot'), [bets]);
  const tennisStats = useMemo(
    () => computeStatsBySport(bets, 'tennis'),
    [bets],
  );
  const monthlies = useMemo(() => computeStatsByMonth(bets), [bets]);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Image rayures dorées en background absolu sur tout l'écran */}
      <ExpoImage
        source={require('@/assets/images/bg-stats.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      {/* Overlay sombre pour la lisibilité des cards et textes */}
      <View style={styles.bgOverlay} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Bloc intro */}
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>
            — DEPUIS LE LANCEMENT
          </Text>
          <Text style={[styles.h1, { color: c.text }]}>
            Notre bilan complet.
          </Text>
          <Text style={[styles.lead, { color: c.textMuted }]}>
            {globalStats.total} pronostics publiés. Transparence totale, gains
            et pertes inclus.
          </Text>
        </View>

        {/* Card stats globale avec border doré */}
        <BigStatsCard stats={globalStats} />

        {/* Bilan par sport */}
        <Section title="Par sport">
          <View style={styles.sportGrid}>
            <SportStatsCard label="Football" emoji="⚽" stats={footStats} />
            <SportStatsCard label="Tennis" emoji="🎾" stats={tennisStats} />
          </View>
        </Section>

        {/* Bilan par mois */}
        <Section title="Mois par mois">
          <View style={{ gap: Spacing.two }}>
            {monthlies.map((m) => (
              <MonthRow key={m.ym} label={m.label} stats={m.stats} />
            ))}
          </View>
        </Section>

        {/* Disclaimer ANJ obligatoire en bas */}
        <View
          style={[
            styles.disclaimerBlock,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}>
          <View style={[styles.disclaimerBadge, { backgroundColor: c.gold }]}>
            <Text style={styles.disclaimerBadgeText}>+18</Text>
          </View>
          <Text style={[styles.disclaimer, { color: c.textMuted }]}>
            Performance passée, ne préjuge pas du futur. Les paris sportifs
            comportent des risques de pertes financières. Service réservé aux
            +18 ans.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function BigStatsCard({ stats }: { stats: GlobalStats }) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.bigStatsCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.gold,
          shadowColor: c.gold,
        },
      ]}>
      <View style={styles.bigStatsRow}>
        <BigStat
          label="Réussite"
          value={`${stats.winRate}%`}
          sub={`${stats.wins} / ${stats.wins + stats.losses + stats.voids}`}
        />
        <Divider />
        <BigStat label="Cote moy." value={stats.avgOdd.toFixed(2)} sub="—" />
        <Divider />
        <BigStat
          label="ROI théo."
          value={`${stats.theoreticalRoi > 0 ? '+' : ''}${stats.theoreticalRoi}%`}
          sub="mise 1u"
          highlight={stats.theoreticalRoi >= 0 ? c.success : c.danger}
        />
      </View>
      <View
        style={[
          styles.footnoteRow,
          { borderTopColor: 'rgba(232,201,90,0.15)' },
        ]}>
        <View
          style={[styles.footnoteIcon, { backgroundColor: 'rgba(232,201,90,0.15)' }]}>
          <SymbolView
            name="info.circle.fill"
            size={14}
            tintColor={c.gold}
            weight="semibold"
          />
        </View>
        <Text style={[styles.bigStatsFootnote, { color: c.textMuted }]}>
          ROI théorique calculé en supposant 1 unité misée par pronostic.
          Pas de notion de mise en euros — chacun adapte selon son budget.
        </Text>
      </View>
    </View>
  );
}

function BigStat({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub: string;
  highlight?: string;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.bigStat}>
      <Text
        style={[styles.bigStatValue, { color: highlight ?? c.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.5}>
        {value}
      </Text>
      <Text style={[styles.bigStatLabel, { color: c.text }]}>{label}</Text>
      <Text style={[styles.bigStatSub, { color: c.textDim }]}>{sub}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
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
      {children}
    </View>
  );
}

function SportStatsCard({
  label,
  emoji,
  stats,
}: {
  label: string;
  emoji: string;
  stats: GlobalStats;
}) {
  const c = useThemeColors();
  const resolved = stats.wins + stats.losses + stats.voids;
  return (
    <View
      style={[
        styles.sportCard,
        { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
      ]}>
      <View style={[styles.sportEmojiBubble, { backgroundColor: 'rgba(232,201,90,0.15)' }]}>
        <Text style={styles.sportEmoji}>{emoji}</Text>
      </View>
      <View style={styles.sportCardBody}>
        <Text style={[styles.sportCardLabel, { color: c.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.sportCardValue, { color: c.text }]}>
          {stats.winRate}%
        </Text>
        <Text style={[styles.sportCardSub, { color: c.textMuted }]}>
          {stats.wins}V · {stats.losses}D
          {stats.voids > 0 ? ` · ${stats.voids}A` : ''}
        </Text>
        <Text style={[styles.sportCardSubDim, { color: c.textDim }]}>
          sur {resolved} résolu{resolved > 1 ? 's' : ''}
        </Text>
      </View>
    </View>
  );
}

function MonthRow({
  label,
  stats,
}: {
  label: string;
  stats: GlobalStats;
}) {
  const c = useThemeColors();
  const resolved = stats.wins + stats.losses + stats.voids;
  const roiColor =
    stats.theoreticalRoi > 0
      ? c.success
      : stats.theoreticalRoi < 0
        ? c.danger
        : c.textMuted;
  return (
    <View
      style={[
        styles.monthRow,
        { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
      ]}>
      <View
        style={[styles.monthIcon, { backgroundColor: 'rgba(232,201,90,0.15)' }]}>
        <SymbolView
          name="calendar"
          size={16}
          tintColor={c.gold}
          weight="medium"
        />
      </View>
      <View style={styles.monthLabel}>
        <Text style={[styles.monthName, { color: c.text }]}>{label}</Text>
        <Text style={[styles.monthSub, { color: c.textDim }]}>
          {resolved} pronostic{resolved > 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.monthMetrics}>
        <View style={styles.monthMetric}>
          <Text style={[styles.monthMetricValue, { color: c.text }]}>
            {stats.winRate}%
          </Text>
          <Text style={[styles.monthMetricLabel, { color: c.textDim }]}>
            réussite
          </Text>
        </View>
        <View style={styles.monthMetric}>
          <Text style={[styles.monthMetricValue, { color: roiColor }]}>
            {stats.theoreticalRoi > 0 ? '+' : ''}
            {stats.theoreticalRoi}%
          </Text>
          <Text style={[styles.monthMetricLabel, { color: c.textDim }]}>
            ROI théo.
          </Text>
        </View>
        <SymbolView
          name="chevron.right"
          size={12}
          tintColor={c.textDim}
          weight="semibold"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  headerBlock: {
    gap: 8,
    marginTop: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '700',
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
  },
  bigStatsCard: {
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: Spacing.three,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  bigStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  bigStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  bigStatValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  bigStatLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 6,
  },
  bigStatSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 48,
    backgroundColor: 'rgba(250,250,247,0.15)',
    marginHorizontal: 4,
  },
  footnoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footnoteIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStatsFootnote: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  sportGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sportCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  sportEmojiBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportCardBody: {
    flex: 1,
    gap: 2,
  },
  sportCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  sportCardValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 30,
  },
  sportCardSub: {
    fontSize: 11,
    marginTop: 4,
  },
  sportCardSubDim: {
    fontSize: 11,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  monthIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    flex: 1,
    gap: 2,
  },
  monthName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  monthSub: {
    fontSize: 11,
  },
  monthMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  monthMetric: {
    alignItems: 'flex-end',
    gap: 2,
  },
  monthMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  monthMetricLabel: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  disclaimerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  disclaimerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  disclaimerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  disclaimer: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
