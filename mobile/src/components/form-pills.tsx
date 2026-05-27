import { StyleSheet, Text, View } from 'react-native';

import type { FormSlot } from '@/types/prono';

const COLORS: Record<FormSlot, { bg: string; fg: string }> = {
  W: { bg: '#10B981', fg: '#FFFFFF' },
  D: { bg: '#A8A29E', fg: '#FFFFFF' },
  L: { bg: '#EF4444', fg: '#FFFFFF' },
};

const LABEL: Record<FormSlot, string> = {
  W: 'V',
  D: 'N',
  L: 'D',
};

/**
 * Affiche les 5 derniers résultats d'une équipe sous forme de pastilles V/N/D.
 * V = victoire, N = nul, D = défaite (labels FR).
 */
export function FormPills({
  form,
  size = 20,
}: {
  form: FormSlot[];
  size?: number;
}) {
  const fontSize = Math.max(8, Math.round(size * 0.5));
  return (
    <View style={[styles.row, { gap: Math.max(2, Math.round(size * 0.18)) }]}>
      {form.map((slot, i) => (
        <View
          key={i}
          style={[
            styles.pill,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: COLORS[slot].bg,
            },
          ]}>
          <Text style={[styles.pillText, { color: COLORS[slot].fg, fontSize }]}>
            {LABEL[slot]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontWeight: '800',
  },
});
