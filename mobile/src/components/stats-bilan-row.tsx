import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/lib/use-theme-colors';
import type { Bilan } from '@/lib/bilan';

const COLOR_WIN = '#10B981';
const COLOR_LOSS = '#EF4444';

export function StatsBilanRow({ bilan }: { bilan: Bilan }) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.goldDecorative,
          shadowColor: '#0A0A0A',
        },
      ]}>
      <Stat value={`${bilan.winRate}%`} label="Gagnants" />
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />
      <Stat
        value={bilan.avgOdd > 0 ? bilan.avgOdd.toFixed(2) : '—'}
        label="Cote moy."
      />
      <View style={[styles.divider, { backgroundColor: c.borderFaint }]} />
      <BilanWL wins={bilan.wins} losses={bilan.losses} />
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

function BilanWL({ wins, losses }: { wins: number; losses: number }) {
  const c = useThemeColors();
  return (
    <View style={styles.statCol}>
      <View style={styles.wlRow}>
        <Text style={[styles.wlPart, { color: COLOR_WIN }]}>{wins}</Text>
        <Text style={[styles.wlSep, { color: c.textDim }]}>·</Text>
        <Text style={[styles.wlPart, { color: COLOR_LOSS }]}>{losses}</Text>
      </View>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>V · D</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.2,
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
  },
  wlRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  wlPart: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  wlSep: {
    fontSize: 16,
    fontWeight: '600',
  },
});
