import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { ScorePromptSheet } from '@/components/score-prompt-sheet';
import { Radius, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { ComboBet, ComboBetSelection, PronoResult } from '@/types/prono';

/**
 * Sheet d'édition d'un combiné côté admin : permet de modifier le
 * résultat de CHAQUE sélection individuellement (gagné / perdu / annulé /
 * en attente).
 *
 * Utile pour :
 *  - Annuler UNE sélection d'un combo (ex : match du milieu annulé)
 *  - Corriger une erreur d'auto-tracking
 *  - Marquer manuellement les paris tennis (pas d'API)
 *
 * Le résultat global du combo est recalculé automatiquement à la sauvegarde
 * selon la convention bookmaker FR :
 *  - Toutes void → bet void
 *  - Au moins 1 loss → bet loss
 *  - Sinon (que des win, ou win+void) → bet win
 *  - Si au moins 1 pending → bet pending
 */

type SelectionResult = 'pending' | 'win' | 'loss' | 'void';

type Props = {
  visible: boolean;
  combo: ComboBet | null;
  onClose: () => void;
  /** Callback après save réussi (pour refresh la liste admin). */
  onSaved: () => void;
};

export function AdminComboEditSheet({
  visible,
  combo,
  onClose,
  onSaved,
}: Props) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  // State local : map position → new result
  const [edits, setEdits] = useState<Record<number, SelectionResult>>({});
  // Map position → score saisi (si fourni via ScorePromptSheet)
  const [scoreEdits, setScoreEdits] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  // Index de la sélection en cours de saisie de score (null = pas ouvert)
  const [scorePromptIndex, setScorePromptIndex] = useState<number | null>(null);

  // Reset des edits à chaque ouverture (sinon on garde les anciennes valeurs)
  function handleClose() {
    setEdits({});
    setScoreEdits({});
    setScorePromptIndex(null);
    onClose();
  }

  function setSelectionResult(position: number, result: SelectionResult) {
    setEdits((prev) => ({ ...prev, [position]: result }));
    // Win/loss → on ouvre le ScorePromptSheet pour saisir le score.
    // Void/pending → pas besoin de score.
    if (result === 'win' || result === 'loss') {
      setScorePromptIndex(position);
    }
  }

  // Cote ajustée : produit des cotes des sélections non-void
  const adjustedOdd = useMemo(() => {
    if (!combo) return 0;
    let odd = 1;
    combo.selections.forEach((s, i) => {
      const newResult = edits[i] ?? s.result;
      if (newResult !== 'void') odd *= s.odd;
    });
    return Math.round(odd * 100) / 100;
  }, [combo, edits]);

  // Aperçu du résultat global après ces modifs
  const previewGlobalResult: PronoResult | 'mixed' = useMemo(() => {
    if (!combo) return 'pending';
    const results = combo.selections.map(
      (s, i) => edits[i] ?? s.result,
    );
    if (results.some((r) => r === 'pending')) return 'pending';
    if (results.every((r) => r === 'void')) return 'void';
    if (results.some((r) => r === 'loss')) return 'loss';
    return 'win';
  }, [combo, edits]);

  async function handleSave() {
    if (!combo) return;
    const editedKeys = Object.keys(edits);
    if (editedKeys.length === 0) {
      handleClose();
      return;
    }
    setSaving(true);
    const nowISO = new Date().toISOString();

    // 1) Update chaque sélection modifiée
    //    On a besoin du sels[].id depuis la DB (combo n'a pas les ids).
    const { data: sels, error: selsErr } = await supabase
      .from('published_bet_selections')
      .select('id, position')
      .eq('published_bet_id', combo.id);
    if (selsErr || !sels) {
      setSaving(false);
      Alert.alert('Erreur', selsErr?.message ?? 'Sélections introuvables.');
      return;
    }
    const idsByPos = new Map<number, string>();
    for (const s of sels) idsByPos.set(s.position, s.id);

    for (const posStr of editedKeys) {
      const pos = parseInt(posStr, 10);
      const newResult = edits[pos];
      const selId = idsByPos.get(pos);
      if (!selId) continue;
      const update: Record<string, string | null> = {
        result: newResult,
        updated_at: nowISO,
      };
      // Si l'admin a saisi un score pour cette sélection, on l'enregistre
      if (scoreEdits[pos]) update.final_score = scoreEdits[pos];
      await supabase
        .from('published_bet_selections')
        .update(update)
        .eq('id', selId);
    }

    // 2) Update le bet global avec le résultat calculé
    const globalResult: PronoResult =
      previewGlobalResult === 'mixed' ? 'pending' : previewGlobalResult;
    await supabase
      .from('published_bets')
      .update({ result: globalResult, updated_at: nowISO })
      .eq('id', combo.id);

    setSaving(false);
    setEdits({});
    onSaved();
    onClose();
  }

  if (!combo) return null;

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
              <Text style={[styles.title, { color: c.text }]}>
                Modifier le combiné
              </Text>
              <Text style={[styles.subtitle, { color: c.textMuted }]}>
                {combo.selections.length} sélections · cote initiale{' '}
                {combo.combinationOdd.toFixed(2)}
                {adjustedOdd !== combo.combinationOdd ? (
                  <Text style={{ color: c.gold }}>
                    {' '}
                    → ajustée {adjustedOdd.toFixed(2)}
                  </Text>
                ) : null}
              </Text>
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

          {/* Liste des sélections (scrollable si beaucoup) */}
          <ScrollView
            style={{ maxHeight: 420 }}
            contentContainerStyle={{ gap: Spacing.two }}
            showsVerticalScrollIndicator={false}>
            {combo.selections.map((sel, i) => (
              <SelectionRow
                key={i}
                index={i}
                selection={sel}
                currentResult={edits[i] ?? sel.result}
                currentScore={scoreEdits[i] ?? sel.finalScore}
                onChange={(r) => setSelectionResult(i, r)}
                onEditScore={() => setScorePromptIndex(i)}
                c={c}
              />
            ))}
          </ScrollView>

          {/* Footer : aperçu résultat global + CTA */}
          <View
            style={[
              styles.previewBlock,
              { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
            ]}>
            <Text style={[styles.previewLabel, { color: c.textMuted }]}>
              Résultat global après modifications
            </Text>
            <Text
              style={[
                styles.previewValue,
                {
                  color:
                    previewGlobalResult === 'win'
                      ? c.success
                      : previewGlobalResult === 'loss'
                        ? c.danger
                        : previewGlobalResult === 'void'
                          ? c.textDim
                          : c.gold,
                },
              ]}>
              {previewGlobalResult === 'win'
                ? '✓ Combiné GAGNÉ'
                : previewGlobalResult === 'loss'
                  ? '✗ Combiné PERDU'
                  : previewGlobalResult === 'void'
                    ? '⊘ Combiné ANNULÉ (toutes sélections void)'
                    : '⏳ EN ATTENTE (≥ 1 sélection pending)'}
            </Text>
          </View>

          <BrandedButton
            label={saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
            variant="gold"
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>

      {/* ScorePromptSheet imbriqué : s'ouvre quand on clique Gagné/Perdu
          sur une sélection. Pre-rempli vide, sport adapté. */}
      {scorePromptIndex !== null && combo.selections[scorePromptIndex] ? (
        <ScorePromptSheet
          visible
          sport={combo.selections[scorePromptIndex].sport === 'tennis' ? 'tennis' : 'foot'}
          title={`Sélection ${scorePromptIndex + 1} · score ?`}
          subtitle={`${combo.selections[scorePromptIndex].teamHome} vs ${combo.selections[scorePromptIndex].teamAway}`}
          validateLabel="OK"
          allowSkip
          onValidate={(score) => {
            if (score && scorePromptIndex !== null) {
              setScoreEdits((prev) => ({ ...prev, [scorePromptIndex]: score }));
            }
            setScorePromptIndex(null);
          }}
          onClose={() => setScorePromptIndex(null)}
        />
      ) : null}
    </Modal>
  );
}

function SelectionRow({
  index,
  selection,
  currentResult,
  currentScore,
  onChange,
  onEditScore,
  c,
}: {
  index: number;
  selection: ComboBetSelection;
  currentResult: SelectionResult;
  currentScore: string | undefined;
  onChange: (result: SelectionResult) => void;
  /** Ouvre le ScorePromptSheet pour saisir / modifier le score. */
  onEditScore: () => void;
  c: ReturnType<typeof useThemeColors>;
}) {
  const showScore =
    (currentResult === 'win' || currentResult === 'loss') && currentScore;
  const showAddScore =
    (currentResult === 'win' || currentResult === 'loss') && !currentScore;
  return (
    <View
      style={[
        styles.selRow,
        {
          backgroundColor: c.bgDeeper,
          borderColor: currentResult === 'void' ? c.textDim : c.borderFaint,
          opacity: currentResult === 'void' ? 0.65 : 1,
        },
      ]}>
      <View style={styles.selRowHead}>
        <Text style={[styles.selRowIndex, { color: c.gold }]}>{index + 1}.</Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.selRowTitle,
              {
                color: c.text,
                textDecorationLine: currentResult === 'void' ? 'line-through' : 'none',
              },
            ]}
            numberOfLines={1}>
            {selection.teamHome} vs {selection.teamAway}
          </Text>
          <Text style={[styles.selRowSub, { color: c.textMuted }]} numberOfLines={1}>
            {selection.prediction} · cote {selection.odd.toFixed(2)}
          </Text>
        </View>
      </View>
      {/* Picker résultat : 4 boutons compacts */}
      <View style={styles.resultRow}>
        <ResultChip
          label="✓ Gagné"
          color={c.success}
          active={currentResult === 'win'}
          onPress={() => onChange('win')}
        />
        <ResultChip
          label="✗ Perdu"
          color={c.danger}
          active={currentResult === 'loss'}
          onPress={() => onChange('loss')}
        />
        <ResultChip
          label="⊘ Annulé"
          color={c.textMuted}
          active={currentResult === 'void'}
          onPress={() => onChange('void')}
        />
        <ResultChip
          label="⏳ Attente"
          color={c.gold}
          active={currentResult === 'pending'}
          onPress={() => onChange('pending')}
        />
      </View>

      {/* Affichage / édition du score (uniquement si win/loss) */}
      {showScore ? (
        <Pressable
          onPress={onEditScore}
          style={({ pressed }) => [
            styles.scoreLine,
            {
              backgroundColor: c.bgElevated,
              borderColor: c.borderFaint,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <Text style={[styles.scoreLineLabel, { color: c.textMuted }]}>
            SCORE
          </Text>
          <Text style={[styles.scoreLineValue, { color: c.text }]}>
            {currentScore}
          </Text>
          <SymbolView
            name="pencil"
            size={11}
            tintColor={c.gold}
            weight="medium"
          />
        </Pressable>
      ) : showAddScore ? (
        <Pressable
          onPress={onEditScore}
          style={({ pressed }) => [
            styles.addScoreBtn,
            {
              borderColor: c.borderSoft,
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <SymbolView
            name="plus"
            size={11}
            tintColor={c.gold}
            weight="bold"
          />
          <Text style={[styles.addScoreText, { color: c.gold }]}>
            Ajouter le score
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function ResultChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: color,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[
          styles.chipText,
          { color: active ? '#0A0A0A' : color, fontWeight: active ? '800' : '600' },
        ]}>
        {label}
      </Text>
    </Pressable>
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
    gap: Spacing.three,
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
    fontSize: 12,
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
  selRow: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 10,
  },
  selRowHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  selRowIndex: {
    fontSize: 13,
    fontWeight: '800',
  },
  selRowTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  selRowSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  chip: {
    flex: 1,
    minWidth: 70,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  scoreLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  scoreLineLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  scoreLineValue: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  addScoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addScoreText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  previewBlock: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  previewValue: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
