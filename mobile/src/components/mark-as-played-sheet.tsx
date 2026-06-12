import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { Radius, Spacing } from '@/constants/theme';
import { useUserBets } from '@/lib/use-user-bets';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { AnyBet } from '@/types/prono';

export function MarkAsPlayedSheet({
  visible,
  bet,
  onClose,
  onMarked,
}: {
  visible: boolean;
  bet: AnyBet | null;
  onClose: () => void;
  onMarked?: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const { markAsPlayed } = useUserBets();

  const [stakeText, setStakeText] = useState('');
  const [oddText, setOddText] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setStakeText('');
    setOddText('');
    setNotes('');
    setError(null);
    setSubmitting(false);
  }

  async function onConfirm() {
    if (!bet) return;
    setSubmitting(true);
    setError(null);
    // Parse mise en €. Vide → undefined (mise non renseignée).
    let stake: number | undefined = undefined;
    if (stakeText.trim()) {
      const v = parseFloat(stakeText.replace(',', '.'));
      if (Number.isNaN(v) || v <= 0) {
        setError('Mise invalide. Entre une valeur en euros (ex 5,00).');
        setSubmitting(false);
        return;
      }
      stake = v;
    }
    // Parse cote bookmaker (optionnel). Si vide → on garde la cote du prono.
    let customOdd: number | undefined = undefined;
    if (oddText.trim()) {
      const v = parseFloat(oddText.replace(',', '.'));
      if (Number.isNaN(v) || v <= 1) {
        setError('Cote invalide. Entre une valeur > 1 (ex 1,85).');
        setSubmitting(false);
        return;
      }
      customOdd = v;
    }
    const { error: err } = await markAsPlayed(
      bet,
      stake,
      notes.trim() || undefined,
      customOdd,
    );
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    onMarked?.();
    reset();
    onClose();
  }

  function handleClose() {
    if (submitting) return;
    reset();
    onClose();
  }

  if (!bet) return null;

  const title =
    bet.type === 'single'
      ? `${bet.teamHome} - ${bet.teamAway}`
      : `Combiné ${bet.selections.length} sélections`;
  const odd = bet.type === 'single' ? bet.odd : bet.combinationOdd;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={handleClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: c.bgElevated,
                paddingBottom: insets.bottom + Spacing.four,
                borderTopColor: c.borderSoft,
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />

            <Text style={[styles.eyebrow, { color: c.gold }]}>
              — J’AI JOUÉ CE PARI
            </Text>
            <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
              {title}
            </Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>
              Cote {odd.toFixed(2)} · pari sera ajouté à ton carnet
            </Text>

            <View style={styles.fields}>
              <Field
                label="Cote bookmaker"
                hint={`Optionnel — laisse vide pour reprendre notre cote (${odd.toFixed(2)}). Saisis ta cote si elle a changé chez ton bookmaker.`}
                value={oddText}
                onChangeText={setOddText}
                keyboardType="decimal-pad"
                placeholder={`ex. ${odd.toFixed(2)}`}
              />
              <Field
                label="Mise (€)"
                hint="Optionnel — sert au calcul de ton ROI réel"
                value={stakeText}
                onChangeText={setStakeText}
                keyboardType="decimal-pad"
                placeholder="ex. 5,00"
              />
              <Field
                label="Notes"
                hint="Optionnel — pourquoi tu as suivi ce prono"
                value={notes}
                onChangeText={setNotes}
                multiline
                placeholder="ex. fort sur la dynamique, je tente"
              />
            </View>

            {error ? (
              <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
            ) : null}

            <View style={styles.cta}>
              <BrandedButton
                label="Ajouter au carnet"
                loadingLabel="Ajout…"
                loading={submitting}
                onPress={onConfirm}
              />
              <BrandedButton
                label="Annuler"
                variant="ghost"
                onPress={handleClose}
                disabled={submitting}
              />
            </View>

            <View style={styles.legalRow}>
              <SymbolView
                name="info.circle"
                size={12}
                tintColor={c.textDim}
                weight="regular"
              />
              <Text style={[styles.legalText, { color: c.textDim }]}>
                Marquer un pari comme joué ne place aucune mise. Tu paries
                de ton côté chez ton bookmaker.
              </Text>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  hint,
  value,
  onChangeText,
  keyboardType,
  multiline,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
  placeholder?: string;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      {hint ? (
        <Text style={[styles.fieldHint, { color: c.textDim }]}>{hint}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor={c.textDim}
        style={[
          styles.input,
          multiline && styles.inputMulti,
          {
            backgroundColor: c.bgDeeper,
            borderColor: c.borderSoft,
            color: c.text,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.two,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
  },
  fields: {
    gap: Spacing.three,
  },
  fieldBlock: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: 11,
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
    minHeight: 64,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13,
    textAlign: 'center',
  },
  cta: {
    gap: Spacing.two,
  },
  legalRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  legalText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 15,
  },
});
