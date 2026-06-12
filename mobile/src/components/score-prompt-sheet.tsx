import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Keyboard,
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
import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Sheet de saisie du score d'un match, avec UI différente selon le sport :
 *  - foot : 2 champs (home / away)
 *  - tennis : 3 à 5 sets éditables, chaque set avec optionnel tiebreak
 *
 * Output (callback onValidate) :
 *  - foot : "2-1"
 *  - tennis : "7-6(7-5) 3-6 6-7(3-7) 7-6 4-6"
 *
 * Remplace les Alert.prompt en série utilisés avant — UX bien meilleure
 * surtout pour les combos tennis.
 */

type Props = {
  visible: boolean;
  sport: 'foot' | 'tennis';
  /** Titre custom — ex "Match 2/4 · score ?". */
  title: string;
  /** Sous-titre (équipes/joueurs). */
  subtitle?: string;
  /** Label du bouton de validation (ex "Suivant", "Valider"). */
  validateLabel?: string;
  /** Si true, affiche un bouton "Passer" qui ferme sans renvoyer de score. */
  allowSkip?: boolean;
  onValidate: (score: string | undefined) => void;
  onClose: () => void;
};

type SetRow = {
  home: string;
  away: string;
  tieHome?: string;
  tieAway?: string;
  showTie: boolean;
};

const EMPTY_SET = (): SetRow => ({ home: '', away: '', showTie: false });

function buildTennisString(sets: SetRow[]): string {
  return sets
    .filter((s) => s.home !== '' && s.away !== '')
    .map((s) => {
      const main = `${s.home}-${s.away}`;
      if (
        s.showTie &&
        s.tieHome !== undefined &&
        s.tieAway !== undefined &&
        s.tieHome !== '' &&
        s.tieAway !== ''
      ) {
        return `${main}(${s.tieHome}-${s.tieAway})`;
      }
      return main;
    })
    .join(' ');
}

export function ScorePromptSheet({
  visible,
  sport,
  title,
  subtitle,
  validateLabel = 'Valider',
  allowSkip = false,
  onValidate,
  onClose,
}: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();

  // États contrôlés ré-init à chaque ouverture
  const [footHome, setFootHome] = useState('');
  const [footAway, setFootAway] = useState('');
  const [sets, setSets] = useState<SetRow[]>([
    EMPTY_SET(),
    EMPTY_SET(),
    EMPTY_SET(),
  ]);

  // Reset les états quand le sheet s'ouvre
  function resetState() {
    setFootHome('');
    setFootAway('');
    setSets([EMPTY_SET(), EMPTY_SET(), EMPTY_SET()]);
  }

  function handleValidate() {
    if (sport === 'foot') {
      const h = footHome.trim();
      const a = footAway.trim();
      if (h === '' || a === '') {
        onValidate(undefined);
      } else {
        onValidate(`${h}-${a}`);
      }
    } else {
      const result = buildTennisString(sets);
      onValidate(result === '' ? undefined : result);
    }
    resetState();
    Keyboard.dismiss();
  }

  function handleSkip() {
    onValidate(undefined);
    resetState();
    Keyboard.dismiss();
  }

  function handleClose() {
    resetState();
    Keyboard.dismiss();
    onClose();
  }

  function updateSet(i: number, patch: Partial<SetRow>) {
    setSets((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addSet() {
    if (sets.length >= 5) return;
    setSets((prev) => [...prev, EMPTY_SET()]);
  }

  function removeSet(i: number) {
    if (sets.length <= 1) return;
    setSets((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable style={styles.dim} onPress={handleClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.borderSoft,
              paddingBottom: insets.bottom + Spacing.four,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: c.text }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: c.textMuted }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: c.bgDeeper,
                  borderColor: c.borderSoft,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <SymbolView name="xmark" size={14} tintColor={c.text} weight="bold" />
            </Pressable>
          </View>

          {/* Body */}
          {sport === 'foot' ? (
            <View style={styles.footRow}>
              <View style={styles.footTeam}>
                <Text style={[styles.footLabel, { color: c.textDim }]}>Domicile</Text>
                <TextInput
                  value={footHome}
                  onChangeText={setFootHome}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[
                    styles.scoreInput,
                    {
                      backgroundColor: c.bgDeeper,
                      color: c.text,
                      borderColor: c.borderSoft,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={c.textDim}
                />
              </View>
              <Text style={[styles.dash, { color: c.gold }]}>–</Text>
              <View style={styles.footTeam}>
                <Text style={[styles.footLabel, { color: c.textDim }]}>Extérieur</Text>
                <TextInput
                  value={footAway}
                  onChangeText={setFootAway}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={[
                    styles.scoreInput,
                    {
                      backgroundColor: c.bgDeeper,
                      color: c.text,
                      borderColor: c.borderSoft,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={c.textDim}
                />
              </View>
            </View>
          ) : (
            <View style={styles.setsCol}>
              {sets.map((s, i) => (
                <SetRowEditor
                  key={i}
                  index={i}
                  set={s}
                  onChange={(patch) => updateSet(i, patch)}
                  onRemove={
                    sets.length > 1 ? () => removeSet(i) : undefined
                  }
                  c={c}
                />
              ))}
              {sets.length < 5 ? (
                <Pressable
                  onPress={addSet}
                  style={({ pressed }) => [
                    styles.addSetBtn,
                    {
                      borderColor: c.borderSoft,
                      backgroundColor: c.bgDeeper,
                      opacity: pressed ? 0.6 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="plus"
                    size={12}
                    tintColor={c.gold}
                    weight="bold"
                  />
                  <Text style={[styles.addSetText, { color: c.gold }]}>
                    Ajouter un set
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}

          {/* Footer actions */}
          <View style={styles.actionsRow}>
            {allowSkip ? (
              <Pressable
                onPress={handleSkip}
                style={({ pressed }) => [
                  styles.skipBtn,
                  {
                    borderColor: c.borderSoft,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}>
                <Text style={[styles.skipText, { color: c.textMuted }]}>
                  Passer
                </Text>
              </Pressable>
            ) : null}
            <View style={{ flex: 1 }}>
              <BrandedButton
                label={validateLabel}
                onPress={handleValidate}
                variant="gold"
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SetRowEditor({
  index,
  set,
  onChange,
  onRemove,
  c,
}: {
  index: number;
  set: SetRow;
  onChange: (patch: Partial<SetRow>) => void;
  onRemove?: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View style={styles.setRow}>
      <View style={styles.setLabelCol}>
        <Text style={[styles.setLabel, { color: c.textMuted }]}>
          Set {index + 1}
        </Text>
        {onRemove ? (
          <Pressable onPress={onRemove} hitSlop={8}>
            <SymbolView
              name="trash"
              size={12}
              tintColor={c.danger}
              weight="medium"
            />
          </Pressable>
        ) : null}
      </View>
      <View style={styles.setInputsRow}>
        <TextInput
          value={set.home}
          onChangeText={(v) => onChange({ home: v })}
          keyboardType="number-pad"
          maxLength={2}
          style={[
            styles.smallScoreInput,
            {
              backgroundColor: c.bgDeeper,
              color: c.text,
              borderColor: c.borderSoft,
            },
          ]}
          placeholder="—"
          placeholderTextColor={c.textDim}
        />
        <Text style={[styles.smallDash, { color: c.textDim }]}>–</Text>
        <TextInput
          value={set.away}
          onChangeText={(v) => onChange({ away: v })}
          keyboardType="number-pad"
          maxLength={2}
          style={[
            styles.smallScoreInput,
            {
              backgroundColor: c.bgDeeper,
              color: c.text,
              borderColor: c.borderSoft,
            },
          ]}
          placeholder="—"
          placeholderTextColor={c.textDim}
        />
        {set.showTie ? (
          <View style={styles.tieGroup}>
            <Text style={[styles.tieLabel, { color: c.textDim }]}>tb</Text>
            <TextInput
              value={set.tieHome ?? ''}
              onChangeText={(v) => onChange({ tieHome: v })}
              keyboardType="number-pad"
              maxLength={2}
              style={[
                styles.tieInput,
                {
                  backgroundColor: c.bgDeeper,
                  color: c.text,
                  borderColor: c.borderSoft,
                },
              ]}
              placeholder="—"
              placeholderTextColor={c.textDim}
            />
            <Text style={[styles.smallDash, { color: c.textDim }]}>–</Text>
            <TextInput
              value={set.tieAway ?? ''}
              onChangeText={(v) => onChange({ tieAway: v })}
              keyboardType="number-pad"
              maxLength={2}
              style={[
                styles.tieInput,
                {
                  backgroundColor: c.bgDeeper,
                  color: c.text,
                  borderColor: c.borderSoft,
                },
              ]}
              placeholder="—"
              placeholderTextColor={c.textDim}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => onChange({ showTie: true })}
            hitSlop={6}
            style={({ pressed }) => [
              styles.addTieBtn,
              { borderColor: c.borderSoft, opacity: pressed ? 0.6 : 1 },
            ]}>
            <Text style={[styles.addTieText, { color: c.textMuted }]}>
              + Tiebreak
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === foot ===
  footRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.three,
    justifyContent: 'center',
  },
  footTeam: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  footLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scoreInput: {
    width: '100%',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.2,
  },
  dash: {
    fontSize: 36,
    fontWeight: '800',
    paddingBottom: 14,
  },
  // === tennis ===
  setsCol: {
    gap: Spacing.two,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  setLabelCol: {
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  setLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  setInputsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  smallScoreInput: {
    width: 42,
    height: 42,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1.2,
  },
  smallDash: {
    fontSize: 14,
    fontWeight: '700',
  },
  tieGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  tieLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tieInput: {
    width: 30,
    height: 30,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  addTieBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginLeft: 4,
  },
  addTieText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addSetText: {
    fontSize: 13,
    fontWeight: '700',
  },
  // === actions ===
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  skipBtn: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: Radius.md,
    borderWidth: 1.2,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
