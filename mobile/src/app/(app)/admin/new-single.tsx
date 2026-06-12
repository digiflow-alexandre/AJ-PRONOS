import { useRouter } from 'expo-router';
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
import { ScreenshotPicker } from '@/components/screenshot-picker';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePublishedBets } from '@/lib/use-published-bets';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { MatchRow } from '@/types/match';
import type { SubscriptionTier } from '@/types/profile';
import type { Sport } from '@/types/prono';

/** Concatène la compétition de base + l'étape de tournoi pour l'affichage. */
function buildFullCompetition(base: string, etape: string): string {
  const cleanEtape = etape.trim();
  if (!cleanEtape) return base.trim();
  return `${base.trim()} · ${cleanEtape}`;
}

export default function NewSingleBetScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isStaff } = useProfile();
  const { publishSingle } = usePublishedBets();

  // Champs prono global
  const [minTier, setMinTier] =
    useState<Exclude<SubscriptionTier, 'trial'>>('starter');
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [reasoning, setReasoning] = useState('');
  const [bookmakerName, setBookmakerName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | undefined>(undefined);

  // Mode : 'auto' (match depuis API-Football) ou 'manual' (saisie libre)
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  // Match sélectionné depuis l'API (mode auto)
  const [selectedMatch, setSelectedMatch] = useState<MatchRow | null>(null);

  // Champs sélection (utilisés en mode manuel OU pré-remplis depuis match)
  const [sport, setSport] = useState<Sport>('foot');
  // Compétition : id (depuis liste) OU "custom" si saisie libre
  const [competitionId, setCompetitionId] = useState<string | null>(null);
  const [competitionLabel, setCompetitionLabel] = useState('');
  const [etape, setEtape] = useState(''); // ex "J32", "1/4 finale", "Phase de poules"
  const [teamHome, setTeamHome] = useState('');
  const [teamAway, setTeamAway] = useState('');
  const [dateText, setDateText] = useState('');
  const [prediction, setPrediction] = useState('');
  const [oddText, setOddText] = useState('');

  function handleCompetitionChange(opts: {
    id: string;
    label: string;
    customLabel?: string;
  }) {
    setCompetitionId(opts.id);
    setCompetitionLabel(opts.label);
    // Reset équipes si on change de compétition (les équipes ne matchent plus)
    setTeamHome('');
    setTeamAway('');
  }

  // Quand on change de sport, on reset la compétition (cohérence sport ↔ compet)
  function handleSportChange(s: Sport) {
    setSport(s);
    setCompetitionId(null);
    setCompetitionLabel('');
    setTeamHome('');
    setTeamAway('');
  }

  // Quand l'admin sélectionne un match depuis l'API → pré-remplit tous les champs
  function handleMatchSelected(match: MatchRow) {
    setSelectedMatch(match);
    setSport(match.sport);
    setCompetitionId(match.competition_id);
    setCompetitionLabel(match.competition_label);
    setEtape(match.competition_etape ?? '');
    setTeamHome(match.team_home);
    setTeamAway(match.team_away);
    // Format JJ/MM/AAAA HH:MM
    const d = new Date(match.match_start_at);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    setDateText(`${dd}/${mm}/${yyyy} ${hh}:${min}`);
  }

  function handleClearMatch() {
    setSelectedMatch(null);
    setCompetitionId(null);
    setCompetitionLabel('');
    setEtape('');
    setTeamHome('');
    setTeamAway('');
    setDateText('');
  }

  const [submitting, setSubmitting] = useState(false);

  // Wizard 2 étapes : 1 = Le match + Le pari, 2 = Diffusion + Analyse + Publier
  const [step, setStep] = useState<1 | 2>(1);

  /** Vérifie qu'on a tout ce qu'il faut avant de passer à l'étape 2. */
  function canGoToStep2(): { ok: boolean; reason?: string } {
    if (!competitionId || !competitionLabel.trim())
      return { ok: false, reason: 'Sélectionne d\'abord la compétition.' };
    if (!teamHome.trim() || !teamAway.trim())
      return { ok: false, reason: 'Indique les deux équipes / joueurs.' };
    if (!parseDateInput(dateText))
      return { ok: false, reason: 'Date invalide. Format : JJ/MM/AAAA HH:MM.' };
    if (!prediction.trim())
      return { ok: false, reason: 'Construis ton pronostic (au moins une condition).' };
    if (Number.isNaN(parseFloat(oddText.replace(',', '.'))) || parseFloat(oddText.replace(',', '.')) <= 1)
      return { ok: false, reason: 'Cote invalide (doit être > 1).' };
    return { ok: true };
  }

  function handleContinue() {
    const check = canGoToStep2();
    if (!check.ok) {
      Alert.alert('Étape 1 incomplète', check.reason ?? '');
      return;
    }
    setStep(2);
  }

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
    const matchStartIso = parseDateInput(dateText);
    const odd = parseFloat(oddText.replace(',', '.'));

    // Validation
    if (!competitionId || !competitionLabel.trim()) {
      return Alert.alert('Compétition manquante', 'Sélectionne ou saisis une compétition.');
    }
    if (!teamHome.trim() || !teamAway.trim()) {
      return Alert.alert(
        'Champ manquant',
        'Indique les noms des deux équipes/joueurs.',
      );
    }
    if (!matchStartIso) {
      return Alert.alert(
        'Date invalide',
        'Format attendu : JJ/MM/AAAA HH:MM (ex 03/06/2026 21:00).',
      );
    }
    if (!prediction.trim()) {
      return Alert.alert(
        'Champ manquant',
        'Indique le pari proposé (ex « Victoire PSG »).',
      );
    }
    if (Number.isNaN(odd) || odd <= 1) {
      return Alert.alert(
        'Cote invalide',
        'La cote doit être un nombre supérieur à 1 (ex 1.85).',
      );
    }
    if (!reasoning.trim()) {
      return Alert.alert(
        'Analyse manquante',
        'Rédige une analyse pour justifier le pari (au moins 1-2 phrases).',
      );
    }

    setSubmitting(true);
    const fullCompetition = buildFullCompetition(competitionLabel, etape);
    const { error } = await publishSingle({
      minTier,
      confidence,
      reasoning: reasoning.trim(),
      bookmakerName: bookmakerName.trim() || undefined,
      bookmakerScreenshotUrl: screenshotUrl,
      matchApiFixtureId: selectedMatch?.api_fixture_id,
      selection: {
        sport,
        competition: fullCompetition,
        teamHome: teamHome.trim(),
        teamAway: teamAway.trim(),
        matchStartAt: matchStartIso,
        prediction: prediction.trim(),
        odd,
      },
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Erreur publication', error);
      return;
    }
    Alert.alert('✓ Pronostic publié', 'Il est visible chez les abonnés.');
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
        {/* Indicateur d'étape */}
        <View style={styles.stepBar}>
          <Text style={[styles.stepLabel, { color: step === 1 ? c.gold : c.textDim }]}>
            1 · Le pari
          </Text>
          <View style={[styles.stepDivider, { backgroundColor: c.borderFaint }]} />
          <Text style={[styles.stepLabel, { color: step === 2 ? c.gold : c.textDim }]}>
            2 · Diffusion
          </Text>
        </View>

        {/* ÉTAPE 1 — Le match + Le pari */}
        {step === 1 ? <>
        <Text style={[styles.sectionTitle, { color: c.gold }]}>
          — LE MATCH
        </Text>

        {mode === 'auto' ? (
          // Mode auto : sélection depuis API-Football
          <AdminMatchPicker
            value={selectedMatch}
            onSelect={handleMatchSelected}
            onClear={handleClearMatch}
            onSwitchToManual={() => setMode('manual')}
          />
        ) : (
          // Mode manuel : saisie libre (compétition non trackée par l'API)
          <>
            <SportPicker value={sport} onChange={handleSportChange} />

            <CompetitionPicker
              sport={sport}
              competitionId={competitionId}
              customLabel={competitionLabel}
              onChange={handleCompetitionChange}
            />

            <BetFormField
              label="Étape / journée (optionnel)"
              value={etape}
              onChangeText={setEtape}
              placeholder='ex. J32 · 1/4 finale · Phase de poules'
              hint='Affichage final : "Ligue 1 · J32"'
            />

            <TeamPicker
              sport={sport}
              competitionId={competitionId}
              label={sport === 'foot' ? 'Équipe domicile' : 'Joueur'}
              value={teamHome}
              onChange={setTeamHome}
            />
            <TeamPicker
              sport={sport}
              competitionId={competitionId}
              label={sport === 'foot' ? 'Équipe extérieur' : 'Adversaire'}
              value={teamAway}
              onChange={setTeamAway}
            />
            <BetFormField
              label="Date & heure du match"
              value={dateText}
              onChangeText={setDateText}
              placeholder="JJ/MM/AAAA HH:MM"
              keyboardType="numbers-and-punctuation"
            />
            <Pressable
              onPress={() => {
                setMode('auto');
                handleClearMatch();
              }}
              hitSlop={6}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
                alignSelf: 'center',
                paddingVertical: 4,
              })}>
              <Text style={[styles.modeSwitch, { color: c.gold }]}>
                ← Revenir au sélecteur de match
              </Text>
            </Pressable>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: c.gold }]}>— LE PARI</Text>

        <Text style={[styles.label, { color: c.text }]}>Pronostic</Text>
        <BetConditionBuilder
          teamHome={teamHome}
          teamAway={teamAway}
          onPredictionChange={setPrediction}
          initialPrediction={prediction}
        />

        <BetFormField
          label="Cote"
          value={oddText}
          onChangeText={setOddText}
          placeholder="ex. 1.85"
          keyboardType="decimal-pad"
        />

        {/* Bouton continuer vers étape 2 */}
        <View style={{ height: Spacing.three }} />
        <BrandedButton label="Continuer →" onPress={handleContinue} />
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1, alignSelf: 'center' }]}>
          <Text style={[styles.cancel, { color: c.textMuted }]}>
            Annuler
          </Text>
        </Pressable>
        </> : null}

        {/* ÉTAPE 2 — Diffusion + Analyse + Publier */}
        {step === 2 ? <>
        {/* Récap rapide de l'étape 1 */}
        <View style={[styles.recap, { backgroundColor: c.bgElevated, borderColor: c.gold }]}>
          <Text style={[styles.recapEyebrow, { color: c.gold }]}>RÉCAP DU PARI</Text>
          <Text style={[styles.recapTeams, { color: c.text }]}>
            {teamHome} vs {teamAway}
          </Text>
          <Text style={[styles.recapPred, { color: c.textMuted }]}>
            {prediction}
          </Text>
          <View style={styles.recapBottom}>
            <Text style={[styles.recapOdd, { color: c.gold }]}>
              {parseFloat(oddText.replace(',', '.')).toFixed(2)}
            </Text>
            <Pressable
              onPress={() => setStep(1)}
              hitSlop={6}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
              <Text style={[styles.recapEdit, { color: c.gold }]}>← Modifier</Text>
            </Pressable>
          </View>
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
          label="Analyse Julien"
          value={reasoning}
          onChangeText={setReasoning}
          placeholder="Pourquoi ce pari : forme, contexte, value..."
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
          label="Publier le pronostic"
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
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
  modeSwitch: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: Spacing.two,
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
  // Wizard steps
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
  // Récap step 2
  recap: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  recapEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  recapTeams: {
    fontSize: 14,
    fontWeight: '800',
  },
  recapPred: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  recapBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  recapOdd: {
    fontSize: 16,
    fontWeight: '900',
  },
  recapEdit: {
    fontSize: 12,
    fontWeight: '700',
  },
});
