/**
 * SelectionSubFlow — Modal plein écran pour saisir une sélection de combiné.
 *
 * Stepper interne 3 étapes :
 *   1. Match    → AdminMatchPicker (filtre par compétition intégré)
 *   2. Conditions → BetConditionBuilder (le picker structuré)
 *   3. Cote     → champ numérique XXL
 *
 * Quand l'admin valide la cote, on appelle onValidate avec la sélection
 * remplie. Le parent (new-combo.tsx) ferme alors le modal et marque la
 * sélection N comme complétée.
 */

import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  BetFormField,
  SportPicker,
  parseDateInput,
} from '@/components/admin-bet-form';
import { AdminMatchPicker } from '@/components/admin-match-picker';
import {
  CompetitionPicker,
  TeamPicker,
} from '@/components/admin-pickers';
import { BetConditionBuilder } from '@/components/bet-condition-builder';
import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { MatchRow } from '@/types/match';
import type { Sport } from '@/types/prono';

type SubStep = 'match' | 'conditions' | 'odd';

export type SubFlowSelectionData = {
  mode: 'auto' | 'manual';
  selectedMatch: MatchRow | null;
  sport: Sport;
  competitionId: string | null;
  competitionLabel: string;
  etape: string;
  teamHome: string;
  teamAway: string;
  dateText: string;
  prediction: string;
  oddText: string;
  miniReasoning: string;
};

export function SelectionSubFlow({
  visible,
  index,
  initialData,
  onCancel,
  onValidate,
}: {
  visible: boolean;
  index: number;
  initialData: SubFlowSelectionData;
  onCancel: () => void;
  onValidate: (data: SubFlowSelectionData) => void;
}) {
  const c = useThemeColors();
  const [data, setData] = useState<SubFlowSelectionData>(initialData);
  const [step, setStep] = useState<SubStep>('match');

  // Reset state quand on ouvre le modal pour une nouvelle sélection
  function patch(p: Partial<SubFlowSelectionData>) {
    setData((prev) => ({ ...prev, ...p }));
  }

  function applyMatch(match: MatchRow) {
    const d = new Date(match.match_start_at);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    patch({
      selectedMatch: match,
      sport: match.sport,
      competitionId: match.competition_id,
      competitionLabel: match.competition_label,
      etape: match.competition_etape ?? '',
      teamHome: match.team_home,
      teamAway: match.team_away,
      dateText: `${dd}/${mm}/${yyyy} ${hh}:${min}`,
    });
  }

  const matchOk =
    !!data.competitionId &&
    data.competitionLabel.trim().length > 0 &&
    data.teamHome.trim().length > 0 &&
    data.teamAway.trim().length > 0 &&
    !!parseDateInput(data.dateText);

  const conditionsOk = data.prediction.trim().length > 0;

  const oddNum = parseFloat(data.oddText.replace(',', '.'));
  const oddOk = !Number.isNaN(oddNum) && oddNum > 1;

  function goNext() {
    if (step === 'match' && matchOk) setStep('conditions');
    else if (step === 'conditions' && conditionsOk) setStep('odd');
    else if (step === 'odd' && oddOk) onValidate(data);
  }

  function goBack() {
    if (step === 'conditions') setStep('match');
    else if (step === 'odd') setStep('conditions');
    else onCancel();
  }

  const stepLabel: Record<SubStep, string> = {
    match: 'Match',
    conditions: 'Conditions',
    odd: 'Cote',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.full, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.borderFaint }]}>
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={({ pressed }) => [styles.headerBack, { opacity: pressed ? 0.5 : 1 }]}>
            <SymbolView name="chevron.backward" size={16} tintColor={c.gold} weight="semibold" />
            <Text style={[styles.headerBackText, { color: c.gold }]}>
              {step === 'match' ? 'Combiné' : 'Retour'}
            </Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            Sélection {index + 1} · {stepLabel[step]}
          </Text>
          <Pressable
            onPress={goNext}
            disabled={
              (step === 'match' && !matchOk) ||
              (step === 'conditions' && !conditionsOk) ||
              (step === 'odd' && !oddOk)
            }
            hitSlop={10}
            style={({ pressed }) => [styles.headerNext, { opacity: pressed ? 0.5 : 1 }]}>
            <Text
              style={[
                styles.headerNextText,
                {
                  color:
                    (step === 'match' && !matchOk) ||
                    (step === 'conditions' && !conditionsOk) ||
                    (step === 'odd' && !oddOk)
                      ? c.textDim
                      : c.gold,
                },
              ]}>
              {step === 'odd' ? 'Valider' : 'Suivant'}
            </Text>
          </Pressable>
        </View>

        {/* Step bar */}
        <View style={styles.stepBar}>
          <StepPill label="Match" active={step === 'match'} done={step !== 'match'} />
          <View style={[styles.stepLine, { backgroundColor: c.borderFaint }]} />
          <StepPill
            label="Conditions"
            active={step === 'conditions'}
            done={step === 'odd'}
          />
          <View style={[styles.stepLine, { backgroundColor: c.borderFaint }]} />
          <StepPill label="Cote" active={step === 'odd'} done={false} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          {step === 'match' ? (
            <MatchStep data={data} patch={patch} applyMatch={applyMatch} />
          ) : null}
          {step === 'conditions' ? (
            <ConditionsStep data={data} patch={patch} />
          ) : null}
          {step === 'odd' ? (
            <OddStep data={data} patch={patch} onSubmit={() => oddOk && onValidate(data)} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ============================================================
// Step components
// ============================================================

function MatchStep({
  data,
  patch,
  applyMatch,
}: {
  data: SubFlowSelectionData;
  patch: (p: Partial<SubFlowSelectionData>) => void;
  applyMatch: (m: MatchRow) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ gap: Spacing.three }}>
      {data.mode === 'auto' ? (
        <AdminMatchPicker
          value={data.selectedMatch}
          onSelect={applyMatch}
          onClear={() =>
            patch({
              selectedMatch: null,
              competitionId: null,
              competitionLabel: '',
              etape: '',
              teamHome: '',
              teamAway: '',
              dateText: '',
            })
          }
          onSwitchToManual={() => patch({ mode: 'manual' })}
        />
      ) : (
        <View style={{ gap: Spacing.three }}>
          <SportPicker
            value={data.sport}
            onChange={(s) =>
              patch({
                sport: s,
                competitionId: null,
                competitionLabel: '',
                teamHome: '',
                teamAway: '',
              })
            }
          />
          <CompetitionPicker
            sport={data.sport}
            competitionId={data.competitionId}
            customLabel={data.competitionLabel}
            onChange={(opts) =>
              patch({
                competitionId: opts.id,
                competitionLabel: opts.label,
                teamHome: '',
                teamAway: '',
              })
            }
          />
          <BetFormField
            label="Étape (optionnel)"
            value={data.etape}
            onChangeText={(v) => patch({ etape: v })}
            placeholder="ex. J32 · 1/4 finale"
          />
          <TeamPicker
            sport={data.sport}
            competitionId={data.competitionId}
            label={data.sport === 'foot' ? 'Équipe domicile' : 'Joueur'}
            value={data.teamHome}
            onChange={(v) => patch({ teamHome: v })}
          />
          <TeamPicker
            sport={data.sport}
            competitionId={data.competitionId}
            label={data.sport === 'foot' ? 'Équipe extérieur' : 'Adversaire'}
            value={data.teamAway}
            onChange={(v) => patch({ teamAway: v })}
          />
          <BetFormField
            label="Date & heure"
            value={data.dateText}
            onChangeText={(v) => patch({ dateText: v })}
            placeholder="JJ/MM/AAAA HH:MM"
          />
          <Pressable
            onPress={() =>
              patch({
                mode: 'auto',
                selectedMatch: null,
                competitionId: null,
                competitionLabel: '',
                etape: '',
                teamHome: '',
                teamAway: '',
                dateText: '',
              })
            }
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'center' })}>
            <Text style={{ color: c.gold, fontSize: 13, fontWeight: '700' }}>
              ← Revenir au sélecteur API
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function ConditionsStep({
  data,
  patch,
}: {
  data: SubFlowSelectionData;
  patch: (p: Partial<SubFlowSelectionData>) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ gap: Spacing.three }}>
      {/* Match rappel */}
      <View style={[styles.matchRecall, { backgroundColor: c.bgWarm, borderColor: c.gold }]}>
        <Text style={[styles.matchRecallComp, { color: c.gold }]} numberOfLines={1}>
          {data.competitionLabel}
          {data.etape ? ` · ${data.etape}` : ''}
        </Text>
        <Text style={[styles.matchRecallTeams, { color: c.text }]} numberOfLines={1}>
          {data.teamHome} <Text style={{ color: c.gold }}>vs</Text> {data.teamAway}
        </Text>
      </View>
      <Text style={[styles.label, { color: c.text }]}>Pronostic</Text>
      <BetConditionBuilder
        teamHome={data.teamHome}
        teamAway={data.teamAway}
        onPredictionChange={(v) => patch({ prediction: v })}
        initialPrediction={data.prediction}
      />
    </View>
  );
}

function OddStep({
  data,
  patch,
  onSubmit,
}: {
  data: SubFlowSelectionData;
  patch: (p: Partial<SubFlowSelectionData>) => void;
  onSubmit: () => void;
}) {
  const c = useThemeColors();
  return (
    <View style={{ gap: Spacing.three }}>
      <View style={[styles.matchRecall, { backgroundColor: c.bgWarm, borderColor: c.gold }]}>
        <Text style={[styles.matchRecallComp, { color: c.gold }]} numberOfLines={1}>
          {data.competitionLabel}
        </Text>
        <Text style={[styles.matchRecallTeams, { color: c.text }]} numberOfLines={1}>
          {data.teamHome} <Text style={{ color: c.gold }}>vs</Text> {data.teamAway}
        </Text>
        <Text style={[styles.matchRecallPred, { color: c.textMuted }]} numberOfLines={2}>
          {data.prediction}
        </Text>
      </View>
      <Text style={[styles.label, { color: c.text }]}>Cote de cette sélection</Text>
      <TextInput
        value={data.oddText}
        onChangeText={(v) => patch({ oddText: v })}
        keyboardType="decimal-pad"
        placeholder="ex. 2.10"
        placeholderTextColor={c.textDim}
        onSubmitEditing={onSubmit}
        style={[
          styles.oddInput,
          { backgroundColor: c.bgDeeper, color: c.gold, borderColor: c.gold },
        ]}
      />
      <BetFormField
        label="Mini-analyse (optionnel)"
        value={data.miniReasoning}
        onChangeText={(v) => patch({ miniReasoning: v })}
        placeholder="1-2 phrases pour cette sélection"
        multiline
      />
    </View>
  );
}

// ============================================================
// Helpers
// ============================================================

function StepPill({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  const c = useThemeColors();
  return (
    <View style={styles.stepPill}>
      <View
        style={[
          styles.stepDot,
          {
            backgroundColor: done ? c.gold : active ? c.gold : 'transparent',
            borderColor: done || active ? c.gold : c.borderSoft,
          },
        ]}>
        {done ? (
          <SymbolView name="checkmark" size={9} tintColor="#0A0A0A" weight="bold" />
        ) : null}
      </View>
      <Text
        style={[
          styles.stepText,
          {
            color: active ? c.gold : done ? c.textMuted : c.textDim,
            fontWeight: active ? '800' : '700',
          },
        ]}>
        {label}
      </Text>
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  full: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  headerBackText: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  headerNext: {
    minWidth: 90,
    alignItems: 'flex-end',
  },
  headerNextText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  stepLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  matchRecall: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  matchRecallComp: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  matchRecallTeams: {
    fontSize: 15,
    fontWeight: '800',
  },
  matchRecallPred: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  oddInput: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 14,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
});
