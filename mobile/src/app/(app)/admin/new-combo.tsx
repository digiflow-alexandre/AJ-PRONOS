import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandedButton } from '@/components/branded-button';
import {
  BetFormField,
  ConfidencePicker,
  SportPicker,
  TierPicker,
  parseDateInput,
} from '@/components/admin-bet-form';
import { AdminMatchPicker } from '@/components/admin-match-picker';
import {
  CompetitionPicker,
  TeamPicker,
} from '@/components/admin-pickers';
import { BetConditionBuilder } from '@/components/bet-condition-builder';
import { SelectionSubFlow } from '@/components/selection-sub-flow';
import { ScreenshotPicker } from '@/components/screenshot-picker';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePublishedBets } from '@/lib/use-published-bets';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { MatchRow } from '@/types/match';
import type { SubscriptionTier } from '@/types/profile';
import type { Sport } from '@/types/prono';

type SelectionDraft = {
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

function newEmptySelection(): SelectionDraft {
  return {
    mode: 'auto',
    selectedMatch: null,
    sport: 'foot',
    competitionId: null,
    competitionLabel: '',
    etape: '',
    teamHome: '',
    teamAway: '',
    dateText: '',
    prediction: '',
    oddText: '',
    miniReasoning: '',
  };
}

/** Pré-remplit une sélection à partir d'un match de l'API. */
function applyMatchToSelection(match: MatchRow): Partial<SelectionDraft> {
  const d = new Date(match.match_start_at);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return {
    selectedMatch: match,
    sport: match.sport,
    competitionId: match.competition_id,
    competitionLabel: match.competition_label,
    etape: match.competition_etape ?? '',
    teamHome: match.team_home,
    teamAway: match.team_away,
    dateText: `${dd}/${mm}/${yyyy} ${hh}:${min}`,
  };
}

function buildFullCompetition(base: string, etape: string): string {
  const cleanEtape = etape.trim();
  if (!cleanEtape) return base.trim();
  return `${base.trim()} · ${cleanEtape}`;
}

export default function NewComboBetScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isStaff } = useProfile();
  const { publishCombo } = usePublishedBets();

  const [minTier, setMinTier] =
    useState<Exclude<SubscriptionTier, 'trial'>>('pro');
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [reasoning, setReasoning] = useState('');
  const [bookmakerName, setBookmakerName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined);

  // Démarre avec 2 sélections vides (minimum pour un combo)
  const [selections, setSelections] = useState<SelectionDraft[]>([
    newEmptySelection(),
    newEmptySelection(),
  ]);
  const [submitting, setSubmitting] = useState(false);

  // Wizard 2 étapes : 1 = Sélections, 2 = Diffusion + Analyse + Publier
  const [step, setStep] = useState<1 | 2>(1);

  // État du sous-flow plein écran (édition d'une sélection)
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  function isSelectionComplete(s: SelectionDraft): boolean {
    if (!s.competitionId || !s.competitionLabel.trim()) return false;
    if (!s.teamHome.trim() || !s.teamAway.trim()) return false;
    if (!parseDateInput(s.dateText)) return false;
    if (!s.prediction.trim()) return false;
    const odd = parseFloat(s.oddText.replace(',', '.'));
    if (Number.isNaN(odd) || odd <= 1) return false;
    return true;
  }

  const completeCount = selections.filter(isSelectionComplete).length;
  const allComplete = completeCount === selections.length;

  function handleContinue() {
    if (!allComplete) {
      Alert.alert(
        'Sélections incomplètes',
        `${selections.length - completeCount} sélection${selections.length - completeCount > 1 ? 's' : ''} à compléter avant de continuer.`,
      );
      return;
    }
    setStep(2);
  }

  function updateSel(idx: number, patch: Partial<SelectionDraft>) {
    setSelections((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function addSelection() {
    setSelections((prev) => [...prev, newEmptySelection()]);
  }

  function removeSelection(idx: number) {
    if (selections.length <= 2) {
      Alert.alert(
        'Minimum 2 sélections',
        'Un combiné doit avoir au moins 2 sélections.',
      );
      return;
    }
    setSelections((prev) => prev.filter((_, i) => i !== idx));
  }

  // Calcule la cote totale en live
  const parsedOdds = selections.map((s) => parseFloat(s.oddText.replace(',', '.')));
  const allValidOdds = parsedOdds.every((o) => !Number.isNaN(o) && o > 1);
  const totalOdd = allValidOdds
    ? Math.round(parsedOdds.reduce((acc, o) => acc * o, 1) * 100) / 100
    : null;

  if (!isStaff) {
    return (
      <View style={[styles.locked, { backgroundColor: c.bg }]}>
        <Text style={[styles.lockedText, { color: c.textMuted }]}>
          Réservé à l’équipe.
        </Text>
      </View>
    );
  }

  async function onSubmit() {
    // Validation : chaque sélection doit être complète et valide
    for (let i = 0; i < selections.length; i++) {
      const s = selections[i];
      if (
        !s.competitionId ||
        !s.competitionLabel.trim() ||
        !s.teamHome.trim() ||
        !s.teamAway.trim() ||
        !s.prediction.trim()
      ) {
        return Alert.alert(
          `Sélection ${i + 1} incomplète`,
          'Tous les champs sont obligatoires (sauf étape et mini-analyse).',
        );
      }
      const matchIso = parseDateInput(s.dateText);
      if (!matchIso) {
        return Alert.alert(
          `Sélection ${i + 1} — date invalide`,
          'Format attendu : JJ/MM/AAAA HH:MM.',
        );
      }
      const odd = parsedOdds[i];
      if (Number.isNaN(odd) || odd <= 1) {
        return Alert.alert(
          `Sélection ${i + 1} — cote invalide`,
          'La cote doit être un nombre supérieur à 1.',
        );
      }
    }
    if (!reasoning.trim()) {
      return Alert.alert(
        'Analyse manquante',
        'Rédige une analyse globale pour le combiné.',
      );
    }

    setSubmitting(true);
    const { error } = await publishCombo({
      minTier,
      confidence,
      reasoning: reasoning.trim(),
      bookmakerName: bookmakerName.trim() || undefined,
      bookmakerScreenshotUrl: screenshotUrl,
      selections: selections.map((s, i) => ({
        sport: s.sport,
        competition: buildFullCompetition(s.competitionLabel, s.etape),
        teamHome: s.teamHome.trim(),
        teamAway: s.teamAway.trim(),
        matchStartAt: parseDateInput(s.dateText)!,
        prediction: s.prediction.trim(),
        odd: parsedOdds[i],
        miniReasoning: s.miniReasoning.trim() || undefined,
        matchApiFixtureId: s.selectedMatch?.api_fixture_id,
      })),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Erreur publication', error);
      return;
    }
    Alert.alert(
      '✓ Combiné publié',
      `Cote totale ${totalOdd?.toFixed(2)} · visible chez les abonnés.`,
    );
    router.back();
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + BottomTabInset + Spacing.five },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">

        {/* Step bar 2 étapes */}
        <View style={styles.stepBar}>
          <Text style={[styles.stepLabel, { color: step === 1 ? c.gold : c.textDim }]}>
            1 · Sélections
          </Text>
          <View style={[styles.stepDivider, { backgroundColor: c.borderFaint }]} />
          <Text style={[styles.stepLabel, { color: step === 2 ? c.gold : c.textDim }]}>
            2 · Diffusion
          </Text>
        </View>

        {/* Header avec cote totale en live */}
        <View
          style={[
            styles.headerCard,
            { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
          ]}>
          <Text style={[styles.headerEyebrow, { color: c.gold }]}>
            COTE COMBINÉE
          </Text>
          {totalOdd != null ? (
            <Text style={[styles.headerOdd, { color: c.text, fontSize: 32 }]}>
              {totalOdd.toFixed(2)}
            </Text>
          ) : (
            <Text style={[styles.headerOdd, { color: c.textMuted, fontSize: 14, fontWeight: '700' }]}>
              — · {completeCount}/{selections.length} sélection{selections.length > 1 ? 's' : ''} complétée{completeCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>

        {step === 1 ? <>
        {/* Sélections (cards compactes) */}
        {selections.map((sel, idx) => (
          <CompactSelectionCard
            key={idx}
            index={idx}
            selection={sel}
            complete={isSelectionComplete(sel)}
            onEdit={() => setEditingIdx(idx)}
            onRemove={() => removeSelection(idx)}
          />
        ))}

        <Pressable
          onPress={addSelection}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: c.bgWarm, borderColor: c.gold, opacity: pressed ? 0.7 : 1 },
          ]}>
          <SymbolView name="plus" size={16} tintColor={c.gold} weight="semibold" />
          <Text style={[styles.addBtnText, { color: c.gold }]}>
            Ajouter une {selections.length + 1}{selections.length + 1 === 1 ? 'ère' : 'e'} sélection
          </Text>
        </Pressable>

        <View style={{ height: Spacing.three }} />
        <BrandedButton
          label={allComplete ? 'Continuer →' : `Continuer → (${selections.length - completeCount} à compléter)`}
          onPress={handleContinue}
        />
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, alignSelf: 'center' }]}>
          <Text style={[styles.cancel, { color: c.textMuted }]}>
            Annuler
          </Text>
        </Pressable>
        </> : null}

        {step === 2 ? <>
        {/* Récap des sélections */}
        <View style={[styles.recapBox, { backgroundColor: c.bgElevated, borderColor: c.borderFaint }]}>
          <Text style={[styles.recapEyebrow, { color: c.gold }]}>
            RÉCAP · {selections.length} SÉLECTIONS
          </Text>
          {selections.map((s, i) => (
            <View key={i} style={[styles.recapRow, i < selections.length - 1 && { borderBottomColor: c.borderFaint, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.recapNum, { backgroundColor: c.gold }]}>
                <Text style={styles.recapNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.recapTeams, { color: c.text }]} numberOfLines={1}>
                  {s.teamHome} vs {s.teamAway}
                </Text>
                <Text style={[styles.recapPred, { color: c.textMuted }]} numberOfLines={2}>
                  {s.prediction}
                </Text>
              </View>
              <Text style={[styles.recapOdd, { color: c.gold }]}>
                {parseFloat(s.oddText.replace(',', '.')).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: c.gold }]}>
          — DIFFUSION
        </Text>

        <TierPicker value={minTier} onChange={setMinTier} />

        <Text style={[styles.label, { color: c.text }]}>
          Indice de confiance
        </Text>
        <ConfidencePicker value={confidence} onChange={setConfidence} />

        <BetFormField
          label="Analyse globale du combiné"
          value={reasoning}
          onChangeText={setReasoning}
          placeholder="Pourquoi ce combiné : logique, contexte, opportunité..."
          multiline
        />
        <BetFormField
          label="Bookmaker (optionnel)"
          value={bookmakerName}
          onChangeText={setBookmakerName}
          placeholder="ex. Winamax"
        />

        <ScreenshotPicker
          value={screenshotUrl}
          onChange={setScreenshotUrl}
        />

        <View style={{ height: Spacing.three }} />
        <BrandedButton
          label={`Publier le combiné (cote ${totalOdd?.toFixed(2) ?? '—'})`}
          loadingLabel="Publication…"
          loading={submitting}
          onPress={onSubmit}
        />
        <Pressable
          onPress={() => setStep(1)}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, alignSelf: 'center' }]}>
          <Text style={[styles.cancel, { color: c.textMuted }]}>
            ← Retour à l'étape 1
          </Text>
        </Pressable>
        </> : null}
      </ScrollView>

      {/* Sub-flow plein écran pour éditer une sélection */}
      {editingIdx !== null ? (
        <SelectionSubFlow
          visible
          index={editingIdx}
          initialData={selections[editingIdx]}
          onCancel={() => setEditingIdx(null)}
          onValidate={(data) => {
            updateSel(editingIdx, data);
            setEditingIdx(null);
          }}
        />
      ) : null}
    </KeyboardAvoidingView>
  );
}

// ============================================================
// CompactSelectionCard — affiche soit "Choisir un match" soit le résumé
// ============================================================

function CompactSelectionCard({
  index,
  selection,
  complete,
  onEdit,
  onRemove,
}: {
  index: number;
  selection: SelectionDraft;
  complete: boolean;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.compactCard,
        { backgroundColor: c.bgElevated, borderColor: complete ? c.gold : c.borderSoft },
      ]}>
      <View style={styles.compactHead}>
        <View style={styles.compactHeadLeft}>
          <View style={[styles.compactNum, { backgroundColor: c.gold }]}>
            <Text style={styles.compactNumText}>{index + 1}</Text>
          </View>
          <Text style={[styles.compactTitle, { color: c.text }]}>
            Sélection {index + 1}
          </Text>
        </View>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <SymbolView name="trash" size={16} tintColor={c.danger} weight="medium" />
        </Pressable>
      </View>

      {!complete ? (
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.choosePicker,
            { borderColor: c.gold, opacity: pressed ? 0.6 : 1 },
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <SymbolView name="calendar.badge.plus" size={16} tintColor={c.gold} weight="medium" />
            <Text style={[styles.chooseText, { color: c.gold }]}>
              Choisir un match à venir
            </Text>
          </View>
          <SymbolView name="chevron.right" size={14} tintColor={c.gold} weight="semibold" />
        </Pressable>
      ) : (
        <>
          <View style={[styles.filledBlock, { backgroundColor: c.bgDeeper, borderColor: c.borderFaint }]}>
            <Text style={[styles.filledEyebrow, { color: c.gold }]}>MATCH</Text>
            <Text style={[styles.filledText, { color: c.text }]} numberOfLines={1}>
              {selection.teamHome} vs {selection.teamAway}
            </Text>
            <Text style={[styles.filledSub, { color: c.textMuted }]} numberOfLines={1}>
              {selection.competitionLabel}
              {selection.etape ? ` · ${selection.etape}` : ''}
              {selection.dateText ? ` · ${selection.dateText.split(' ')[1]}` : ''}
            </Text>
          </View>
          <View style={[styles.filledBlock, { backgroundColor: c.bgDeeper, borderColor: c.borderFaint }]}>
            <Text style={[styles.filledEyebrow, { color: c.gold }]}>PRONOSTIC</Text>
            <Text style={[styles.filledText, { color: c.text }]} numberOfLines={3}>
              {selection.prediction}
            </Text>
          </View>
          <View style={styles.filledFooter}>
            <View>
              <Text style={[styles.filledEyebrow, { color: c.gold }]}>COTE</Text>
              <Text style={[styles.filledOdd, { color: c.gold }]}>
                {parseFloat(selection.oddText.replace(',', '.')).toFixed(2)}
              </Text>
            </View>
            <Pressable
              onPress={onEdit}
              hitSlop={6}
              style={({ pressed }) => [styles.editLink, { opacity: pressed ? 0.5 : 1 }]}>
              <SymbolView name="pencil" size={13} tintColor={c.gold} weight="medium" />
              <Text style={[styles.editLinkText, { color: c.gold }]}>Modifier</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

function SelectionForm({
  index,
  selection,
  onUpdate,
  onRemove,
}: {
  index: number;
  selection: SelectionDraft;
  onUpdate: (patch: Partial<SelectionDraft>) => void;
  onRemove: () => void;
}) {
  const c = useThemeColors();
  // En mode auto sans match sélectionné : on affiche juste le picker.
  // Une fois un match sélectionné OU si on passe en manuel, on affiche
  // tous les champs (pré-remplis ou vides).
  const showManualFields =
    selection.mode === 'manual' || selection.selectedMatch != null;

  return (
    <View
      style={[
        styles.selCard,
        { backgroundColor: c.bgDeeper, borderColor: c.borderSoft },
      ]}>
      <View style={styles.selHead}>
        <Text style={[styles.selTitle, { color: c.text }]}>
          Sélection {index + 1}
        </Text>
        <Pressable
          onPress={onRemove}
          hitSlop={10}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
          <SymbolView name="trash" size={16} tintColor={c.danger} weight="medium" />
        </Pressable>
      </View>

      {selection.mode === 'auto' ? (
        <AdminMatchPicker
          value={selection.selectedMatch}
          onSelect={(match) => onUpdate(applyMatchToSelection(match))}
          onClear={() =>
            onUpdate({
              selectedMatch: null,
              competitionId: null,
              competitionLabel: '',
              etape: '',
              teamHome: '',
              teamAway: '',
              dateText: '',
            })
          }
          onSwitchToManual={() => onUpdate({ mode: 'manual' })}
        />
      ) : null}

      {selection.mode === 'manual' ? (
        <Pressable
          onPress={() =>
            onUpdate({
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
          style={({ pressed }) => [
            styles.switchModeBtn,
            { borderColor: c.gold, opacity: pressed ? 0.6 : 1 },
          ]}>
          <SymbolView
            name="arrow.uturn.backward"
            size={13}
            tintColor={c.gold}
            weight="semibold"
          />
          <Text style={[styles.switchModeText, { color: c.gold }]}>
            Revenir au sélecteur
          </Text>
        </Pressable>
      ) : null}

      {showManualFields ? (
        <>
          <SportPicker
            value={selection.sport}
            onChange={(s) =>
              onUpdate({
                sport: s,
                competitionId: null,
                competitionLabel: '',
                teamHome: '',
                teamAway: '',
              })
            }
          />
          <CompetitionPicker
            sport={selection.sport}
            competitionId={selection.competitionId}
            customLabel={selection.competitionLabel}
            onChange={(opts) =>
              onUpdate({
                competitionId: opts.id,
                competitionLabel: opts.label,
                teamHome: '',
                teamAway: '',
              })
            }
          />
          <BetFormField
            label="Étape (optionnel)"
            value={selection.etape}
            onChangeText={(v) => onUpdate({ etape: v })}
            placeholder="ex. J32 · 1/4 finale"
          />
          <TeamPicker
            sport={selection.sport}
            competitionId={selection.competitionId}
            label={selection.sport === 'foot' ? 'Domicile' : 'Joueur'}
            value={selection.teamHome}
            onChange={(v) => onUpdate({ teamHome: v })}
          />
          <TeamPicker
            sport={selection.sport}
            competitionId={selection.competitionId}
            label={selection.sport === 'foot' ? 'Extérieur' : 'Adversaire'}
            value={selection.teamAway}
            onChange={(v) => onUpdate({ teamAway: v })}
          />
          <BetFormField
            label="Date & heure"
            value={selection.dateText}
            onChangeText={(v) => onUpdate({ dateText: v })}
            placeholder="JJ/MM/AAAA HH:MM"
            keyboardType="numbers-and-punctuation"
          />
          <Text style={[styles.label, { color: c.text }]}>Pronostic</Text>
          <BetConditionBuilder
            teamHome={selection.teamHome}
            teamAway={selection.teamAway}
            onPredictionChange={(v) => onUpdate({ prediction: v })}
            initialPrediction={selection.prediction}
          />
          <BetFormField
            label="Cote"
            value={selection.oddText}
            onChangeText={(v) => onUpdate({ oddText: v })}
            placeholder="ex. 1.85"
            keyboardType="decimal-pad"
          />
          <BetFormField
            label="Mini-analyse (optionnel)"
            value={selection.miniReasoning}
            onChangeText={(v) => onUpdate({ miniReasoning: v })}
            placeholder="1-2 phrases pour cette sélection"
            multiline
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headerCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerOdd: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  selCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.three,
  },
  selHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
    marginTop: Spacing.three,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  cancel: {
    fontSize: 13,
    marginTop: Spacing.two,
    textDecorationLine: 'underline',
  },
  locked: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  // === Step bar (wizard 2 étapes principal) ===
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  stepDivider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  // === Compact selection card ===
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  compactHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactNum: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactNumText: {
    color: '#0A0A0A',
    fontSize: 13,
    fontWeight: '900',
  },
  compactTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  choosePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  chooseText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filledBlock: {
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filledEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  filledText: {
    fontSize: 14,
    fontWeight: '700',
  },
  filledSub: {
    fontSize: 11,
    marginTop: 4,
  },
  filledFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  filledOdd: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editLinkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // === Recap step 2 ===
  recapBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  recapEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  recapNum: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recapNumText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '900',
  },
  recapTeams: {
    fontSize: 13,
    fontWeight: '800',
  },
  recapPred: {
    fontSize: 11,
    marginTop: 2,
  },
  recapOdd: {
    fontSize: 14,
    fontWeight: '900',
  },
});
