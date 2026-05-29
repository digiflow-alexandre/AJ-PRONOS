import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { AnyBet } from '@/types/prono';
import { getBetStartDate } from '@/types/prono';

const COLOR_WIN = '#10B981';
const COLOR_LOSS = '#EF4444';

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type MonthBucket = {
  key: string;            // "2026-04"
  year: number;
  month: number;          // 0-11
  label: string;          // "Avril"
  total: number;
  wins: number;
  losses: number;
};

export function MonthPickerSheet({
  visible,
  bets,
  selectedMonthKey,
  onSelect,
  onClose,
}: {
  visible: boolean;
  bets: AnyBet[];
  /** Format "YYYY-MM" du mois actuellement sélectionné, ou null. */
  selectedMonthKey: string | null;
  onSelect: (monthKey: string) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  // Aggrège tous les paris par mois (clé "YYYY-MM")
  const monthBuckets = useMemo<MonthBucket[]>(() => {
    const map = new Map<string, MonthBucket>();
    bets.forEach((b) => {
      const d = new Date(getBetStartDate(b));
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          year,
          month,
          label: MONTHS_FR[month],
          total: 0,
          wins: 0,
          losses: 0,
        });
      }
      const bucket = map.get(key)!;
      bucket.total++;
      if (b.result === 'win') bucket.wins++;
      else if (b.result === 'loss') bucket.losses++;
    });
    // Tri du plus récent au plus ancien
    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [bets]);

  // Regrouper les mois par année pour les sections
  const byYear = useMemo(() => {
    const map = new Map<number, MonthBucket[]>();
    monthBuckets.forEach((m) => {
      if (!map.has(m.year)) map.set(m.year, []);
      map.get(m.year)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [monthBuckets]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View
          style={[
            styles.headerWrap,
            {
              paddingTop: insets.top + 6,
              borderBottomColor: c.borderFaint,
              backgroundColor: c.bgDeeper,
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.headerTitle, { color: c.text }]}>
              CHOISIS TON MOIS
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: c.bgElevated,
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
        </View>

        {/* Liste */}
        <ScrollView
          style={{ flex: 1, backgroundColor: c.bg }}
          contentContainerStyle={{
            padding: Spacing.four,
            paddingBottom: insets.bottom + Spacing.five,
          }}
          showsVerticalScrollIndicator={false}>
          {byYear.length === 0 ? (
            <Text style={[styles.empty, { color: c.textMuted }]}>
              Aucun mois disponible.
            </Text>
          ) : (
            byYear.map(([year, months]) => (
              <View key={year} style={styles.yearBlock}>
                <Text style={[styles.yearLabel, { color: c.textDim }]}>
                  {year}
                </Text>
                <View
                  style={[
                    styles.monthsList,
                    {
                      backgroundColor: c.bgElevated,
                      borderColor: c.borderFaint,
                    },
                  ]}>
                  {months.map((m, i) => {
                    const isSelected = m.key === selectedMonthKey;
                    return (
                      <Pressable
                        key={m.key}
                        onPress={() => {
                          onSelect(m.key);
                          onClose();
                        }}
                        style={({ pressed }) => [
                          styles.monthRow,
                          i > 0 && {
                            borderTopWidth: StyleSheet.hairlineWidth,
                            borderTopColor: c.borderFaint,
                          },
                          isSelected && { backgroundColor: c.bgWarm },
                          { opacity: pressed ? 0.7 : 1 },
                        ]}>
                        <View style={styles.monthMain}>
                          <SymbolView
                            name={
                              isSelected
                                ? 'checkmark.circle.fill'
                                : 'circle'
                            }
                            size={18}
                            tintColor={isSelected ? c.gold : c.borderStrong}
                            weight="semibold"
                          />
                          <Text
                            style={[
                              styles.monthLabel,
                              {
                                color: c.text,
                                fontWeight: isSelected ? '800' : '600',
                              },
                            ]}>
                            {m.label}
                          </Text>
                          <Text
                            style={[styles.monthTotal, { color: c.textMuted }]}>
                            {m.total} {m.total > 1 ? 'paris' : 'pari'}
                          </Text>
                        </View>
                        <View style={styles.monthBilan}>
                          {m.wins > 0 ? (
                            <Text
                              style={[styles.bilanPart, { color: COLOR_WIN }]}>
                              +{m.wins}
                            </Text>
                          ) : null}
                          {m.losses > 0 ? (
                            <Text
                              style={[styles.bilanPart, { color: COLOR_LOSS }]}>
                              -{m.losses}
                            </Text>
                          ) : null}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

export function monthKeyFromDate(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth().toString().padStart(2, '0')}`;
}

export function dateFromMonthKey(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month, 1);
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  // === Header ===
  headerWrap: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: { width: 32 },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === Content ===
  empty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: Spacing.five,
  },
  yearBlock: {
    marginBottom: Spacing.four,
    gap: 8,
  },
  yearLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    paddingHorizontal: 4,
  },
  monthsList: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  monthMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  monthLabel: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  monthTotal: {
    fontSize: 12,
    fontWeight: '600',
  },
  monthBilan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bilanPart: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
