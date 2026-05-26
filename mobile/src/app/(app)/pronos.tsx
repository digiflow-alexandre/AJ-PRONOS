import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandHeader } from '@/components/brand-header';
import { PronoCard } from '@/components/prono-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { PRONOS_FIXTURES } from '@/lib/fixtures';
import { formatLongDate } from '@/lib/format-date';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { TIER_LEVEL } from '@/types/profile';
import type { Prono, Sport } from '@/types/prono';

type SportFilter = 'all' | Sport;

const SPORT_TABS: { value: SportFilter; symbol: string; aria: string }[] = [
  { value: 'all', symbol: 'square.grid.2x2', aria: 'Tous les sports' },
  { value: 'foot', symbol: 'soccerball', aria: 'Football' },
  { value: 'tennis', symbol: 'tennisball', aria: 'Tennis' },
];

// Dates affichées dans le sélecteur — uniquement celles qui ont au moins
// un prono publié (pour le sport actuellement sélectionné).
type DateBucket = {
  iso: string;        // ISO du jour (minuit local)
  short: string;      // "Mer 27"
  long: string;       // "mercredi 27 mai"
  isToday: boolean;
  count: number;
};

export default function PronosScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const { profile, isTrialActive } = useProfile();
  const [sport, setSport] = useState<SportFilter>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Filtrer les pronos par sport, puis grouper par date
  const { dateBuckets, pronosByDate } = useMemo(() => {
    const filtered = PRONOS_FIXTURES.filter(
      (p) => sport === 'all' || p.sport === sport,
    );

    const byDate = new Map<string, Prono[]>();
    filtered.forEach((p) => {
      const d = new Date(p.matchStartAt);
      d.setHours(0, 0, 0, 0);
      const key = d.toISOString();
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(p);
    });

    // Tri intra-jour par heure
    byDate.forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(a.matchStartAt).getTime() -
          new Date(b.matchStartAt).getTime(),
      ),
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buckets: DateBucket[] = Array.from(byDate.keys())
      .sort()
      .map((iso) => {
        const d = new Date(iso);
        return {
          iso,
          short: shortDateLabel(d),
          long: formatLongDate(d.toISOString()),
          isToday: d.getTime() === today.getTime(),
          count: byDate.get(iso)!.length,
        };
      });

    return { dateBuckets: buckets, pronosByDate: byDate };
  }, [sport]);

  // Sélection automatique : aujourd'hui par défaut, sinon le 1er bucket dispo.
  // Pattern "valeur dérivée d'une prop/state" → setState légitime ici.
  useEffect(() => {
    if (dateBuckets.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(null);
      return;
    }
    if (!selectedDate || !dateBuckets.some((b) => b.iso === selectedDate)) {
      const today = dateBuckets.find((b) => b.isToday);
      setSelectedDate((today ?? dateBuckets[0]).iso);
    }
  }, [dateBuckets, selectedDate]);

  function hasAccess(prono: Prono): boolean {
    if (!profile?.tier) return false;
    if (isTrialActive) return true;
    if (profile.tier === 'trial') return false;
    return TIER_LEVEL[profile.tier] >= TIER_LEVEL[prono.minTier];
  }

  function openPrononDetail(prono: Prono) {
    if (!hasAccess(prono)) {
      router.push('/(app)/subscribe');
      return;
    }
    // Fiche détaillée à venir (Phase MVP point 2 du SPEC.md)
  }

  // Counts par sport (utilisés dans les tabs)
  const countsBySport = useMemo(() => {
    const all = PRONOS_FIXTURES.length;
    const foot = PRONOS_FIXTURES.filter((p) => p.sport === 'foot').length;
    const tennis = PRONOS_FIXTURES.filter((p) => p.sport === 'tennis').length;
    return { all, foot, tennis };
  }, []);

  const selectedBucket = dateBuckets.find((b) => b.iso === selectedDate);
  const pronosOfDay = selectedDate ? (pronosByDate.get(selectedDate) ?? []) : [];

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BrandHeader />

      {/* Tabs sport (icônes + count) */}
      <View
        style={[
          styles.sportBar,
          { backgroundColor: c.bg, borderBottomColor: c.borderFaint },
        ]}>
        {SPORT_TABS.map((t) => {
          const count =
            t.value === 'all'
              ? countsBySport.all
              : t.value === 'foot'
                ? countsBySport.foot
                : countsBySport.tennis;
          return (
            <SportTab
              key={t.value}
              symbol={t.symbol}
              aria={t.aria}
              count={count}
              active={sport === t.value}
              onPress={() => setSport(t.value)}
            />
          );
        })}
      </View>

      {/* Sélecteur de date horizontal — `flexGrow: 0` indispensable, sinon
          la ScrollView prend tout l'espace vertical libre par défaut sur RN. */}
      {dateBuckets.length > 0 ? (
        <View
          style={[styles.dateBar, { borderBottomColor: c.borderFaint }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateBarContent}>
            {dateBuckets.map((b) => (
              <DateChip
                key={b.iso}
                bucket={b}
                active={b.iso === selectedDate}
                onPress={() => setSelectedDate(b.iso)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {selectedBucket ? (
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionEyebrow, { color: c.gold }]}>
              {selectedBucket.isToday
                ? `AUJOURD’HUI · ${selectedBucket.long}`
                : selectedBucket.long.toUpperCase()}
            </Text>
            <Text style={[styles.sectionCount, { color: c.textDim }]}>
              {pronosOfDay.length}{' '}
              {pronosOfDay.length > 1 ? 'pronos' : 'prono'}
            </Text>
          </View>
        ) : null}

        {pronosOfDay.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.cards}>
            {pronosOfDay.map((p) => (
              <PronoCard
                key={p.id}
                prono={p}
                hasAccess={hasAccess(p)}
                onPress={() => openPrononDetail(p)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SportTab({
  symbol,
  aria,
  count,
  active,
  onPress,
}: {
  symbol: string;
  aria: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${aria} (${count} pronos)`}
      style={({ pressed }) => [
        styles.sportTab,
        active && { backgroundColor: c.text },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <SymbolView
        name={symbol as never}
        size={18}
        tintColor={active ? c.ctaText : c.textMuted}
        weight="semibold"
      />
      <Text
        style={[
          styles.sportCount,
          { color: active ? c.ctaText : c.textMuted },
        ]}>
        {count}
      </Text>
    </Pressable>
  );
}

function DateChip({
  bucket,
  active,
  onPress,
}: {
  bucket: DateBucket;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateChip,
        active && {
          borderBottomColor: c.gold,
          borderBottomWidth: 2,
        },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text
        style={[
          styles.dateChipText,
          { color: active ? c.text : c.textMuted },
        ]}>
        {bucket.isToday ? "Aujourd'hui" : bucket.short}
      </Text>
      <View
        style={[
          styles.dateChipCountWrap,
          { backgroundColor: active ? c.text : c.bgDeeper },
        ]}>
        <Text
          style={[
            styles.dateChipCount,
            { color: active ? c.ctaText : c.textMuted },
          ]}>
          {bucket.count}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const c = useThemeColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyEyebrow, { color: c.gold }]}>
        — RIEN POUR L’INSTANT
      </Text>
      <Text style={[styles.emptyTitle, { color: c.text }]}>
        Pas encore de prono ici.
      </Text>
      <Text style={[styles.emptyBody, { color: c.textMuted }]}>
        Aucun pronostic publié pour ce jour et ce sport. Active les
        notifications pour être prévenu dès qu’un prono arrive.
      </Text>
    </View>
  );
}

const DAY_LETTERS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function shortDateLabel(d: Date): string {
  const day = DAY_LETTERS_FR[d.getDay()];
  return `${day} ${d.getDate()}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  sportBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  sportCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  dateBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateBarContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  dateChipCountWrap: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.three,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    flexShrink: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  cards: {
    gap: Spacing.three,
  },
  empty: {
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  emptyEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
