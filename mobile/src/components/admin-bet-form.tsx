import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { SubscriptionTier } from '@/types/profile';
import type { Sport } from '@/types/prono';

// =============================================================================
// Helper : parse une date au format JJ/MM/AAAA HH:MM en ISO
// =============================================================================
export function parseDateInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Format attendu : JJ/MM/AAAA HH:MM
  const match = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/,
  );
  if (!match) return null;
  const [, ddStr, mmStr, yyyyStr, hhStr, minStr] = match;
  const dd = parseInt(ddStr, 10);
  const mm = parseInt(mmStr, 10);
  const yyyy = parseInt(yyyyStr, 10);
  const hh = parseInt(hhStr, 10);
  const mins = parseInt(minStr, 10);
  if (
    dd < 1 ||
    dd > 31 ||
    mm < 1 ||
    mm > 12 ||
    yyyy < 2020 ||
    yyyy > 2100 ||
    hh < 0 ||
    hh > 23 ||
    mins < 0 ||
    mins > 59
  ) {
    return null;
  }
  const d = new Date(yyyy, mm - 1, dd, hh, mins, 0, 0);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// =============================================================================
// BetFormField — input de formulaire générique (label + hint + input)
// =============================================================================
export function BetFormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  hint,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?:
    | 'default'
    | 'decimal-pad'
    | 'numbers-and-punctuation'
    | 'number-pad';
  multiline?: boolean;
  hint?: string;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      {hint ? (
        <Text style={[styles.hint, { color: c.textDim }]}>{hint}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        autoCapitalize={keyboardType === 'default' || !keyboardType ? 'sentences' : 'none'}
        autoCorrect={false}
        style={[
          styles.input,
          multiline && styles.inputMulti,
          {
            backgroundColor: c.bgElevated,
            borderColor: c.borderSoft,
            color: c.text,
          },
        ]}
      />
    </View>
  );
}

// =============================================================================
// SportPicker — sélection foot OU tennis
// =============================================================================
export function SportPicker({
  value,
  onChange,
}: {
  value: Sport;
  onChange: (s: Sport) => void;
}) {
  const c = useThemeColors();
  const options: { value: Sport; label: string }[] = [
    { value: 'foot', label: '⚽ Football' },
    { value: 'tennis', label: '🎾 Tennis' },
  ];
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: c.text }]}>Sport</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: isSelected ? c.bgWarm : c.bgElevated,
                  borderColor: isSelected ? c.gold : c.borderSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? c.text : c.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// TierPicker — sélection starter / pro / vip
// =============================================================================
export function TierPicker({
  value,
  onChange,
}: {
  value: Exclude<SubscriptionTier, 'trial'>;
  onChange: (t: Exclude<SubscriptionTier, 'trial'>) => void;
}) {
  const c = useThemeColors();
  const options: {
    value: Exclude<SubscriptionTier, 'trial'>;
    label: string;
  }[] = [
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'vip', label: 'VIP' },
  ];
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.label, { color: c.text }]}>
        Pack minimum requis
      </Text>
      <Text style={[styles.hint, { color: c.textDim }]}>
        Les abonnés de ce pack et au-dessus verront ce prono.
      </Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  flex: 1,
                  backgroundColor: isSelected ? c.bgWarm : c.bgElevated,
                  borderColor: isSelected ? c.gold : c.borderSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? c.text : c.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                    textAlign: 'center',
                  },
                ]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// =============================================================================
// ConfidencePicker — sélection 1-5
// =============================================================================
export function ConfidencePicker({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => {
        const isSelected = value === n;
        return (
          <Pressable
            key={n}
            onPress={() => onChange(n as 1 | 2 | 3 | 4 | 5)}
            style={({ pressed }) => [
              styles.confidenceDot,
              {
                backgroundColor: isSelected ? c.gold : c.bgElevated,
                borderColor: isSelected ? c.gold : c.borderSoft,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Text
              style={[
                styles.confidenceText,
                { color: isSelected ? c.bg : c.textMuted },
              ]}>
              {n}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    lineHeight: 14,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 15,
    marginTop: 4,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  confidenceDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
