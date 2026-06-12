import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/lib/use-theme-colors';

const LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Confiance faible',
  2: 'Confiance modérée',
  3: 'Confiance correcte',
  4: 'Confiance élevée',
  5: 'Confiance maximale',
};

export function ConfidenceDots({
  value,
  showLabel = true,
  dotSize = 8,
  onDarkBg = false,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  showLabel?: boolean;
  dotSize?: number;
  /** Set true si le composant est sur un fond très sombre (image bg
   *  avec overlay) — booste le contraste du label. */
  onDarkBg?: boolean;
}) {
  const c = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={styles.dots}>
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= value;
          return (
            <View
              key={i}
              style={[
                {
                  width: dotSize,
                  height: dotSize,
                  borderRadius: dotSize / 2,
                  backgroundColor: filled ? c.gold : 'transparent',
                  borderWidth: 1,
                  borderColor: filled ? c.gold : c.borderStrong,
                },
              ]}
            />
          );
        })}
      </View>
      {showLabel ? (
        <Text
          style={[
            styles.label,
            { color: onDarkBg ? c.text : c.textMuted },
          ]}>
          {LABELS[value]}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
});
