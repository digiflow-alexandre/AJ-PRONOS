/**
 * BetConditionBuilder — Picker structuré pour saisir une prédiction de pari
 * sportif sous forme de conditions atomiques empilées.
 *
 * Pourquoi : remplacer la saisie texte libre (ex "mexique et moins de 4,5 buts
 * et Gutierrez buteur") par un picker structuré qui génère un texte canonique
 * 100% parsable par notre edge function `track-results`. Plus aucun pari
 * orphelin "void" pour cause de prédiction non comprise.
 *
 * Architecture :
 * 1) Liste de conditions (state interne)
 * 2) Bouton "+ Ajouter une condition" → ouvre le picker du TYPE de pari
 * 3) Après choix du type → modal options spécifiques au type → la condition
 *    est ajoutée à la liste
 * 4) Texte canonique = conditions.map(canonicalText).join(' et ')
 * 5) Sortie via prop onPredictionChange(text: string) à chaque mutation
 */

import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

// ============================================================
// Types
// ============================================================

export type ConditionType =
  | 'winner'
  | 'over_under'
  | 'btts'
  | 'double_chance'
  | 'exact_score'
  | 'scorer'
  | 'halftime'
  | 'handicap'
  | 'corners'
  | 'cards';

export type ConditionOptions =
  | { type: 'winner'; pick: 'home' | 'draw' | 'away' }
  | { type: 'over_under'; direction: 'over' | 'under'; threshold: number }
  | { type: 'btts'; pick: 'yes' | 'no' }
  | { type: 'double_chance'; pick: '1X' | 'X2' | '12' }
  | { type: 'exact_score'; home: number; away: number }
  | { type: 'scorer'; playerName: string; mode: 'any' | 'first' | 'last' }
  | { type: 'halftime'; mode: 'winner'; pick: 'home' | 'draw' | 'away' }
  | { type: 'halftime'; mode: 'score'; home: number; away: number }
  | { type: 'handicap'; side: 'home' | 'away'; value: number }
  | { type: 'corners'; direction: 'over' | 'under'; threshold: number }
  | { type: 'cards'; kind: 'all' | 'yellow' | 'red'; direction: 'over' | 'under'; threshold: number };

export type Condition = {
  id: string;
  options: ConditionOptions;
};

// ============================================================
// Texte canonique parsable par track-results
// ============================================================

export function canonicalText(
  options: ConditionOptions,
  teamHome: string,
  teamAway: string,
): string {
  switch (options.type) {
    case 'winner':
      if (options.pick === 'home') return teamHome;
      if (options.pick === 'away') return teamAway;
      return 'Match nul';
    case 'over_under':
      return `${options.direction === 'over' ? 'Plus de' : 'Moins de'} ${options.threshold} buts`;
    case 'btts':
      return options.pick === 'yes' ? 'BTTS oui' : 'BTTS non';
    case 'double_chance':
      if (options.pick === '1X') return `${teamHome} ou nul`;
      if (options.pick === 'X2') return `${teamAway} ou nul`;
      return `${teamHome} ou ${teamAway}`;
    case 'exact_score':
      return `${options.home}-${options.away}`;
    case 'scorer':
      if (options.mode === 'first') return `${options.playerName} premier buteur`;
      if (options.mode === 'last') return `${options.playerName} dernier buteur`;
      return `${options.playerName} marque`;
    case 'halftime':
      if (options.mode === 'score') {
        return `MT ${options.home}-${options.away}`;
      }
      if (options.pick === 'home') return `MT ${teamHome}`;
      if (options.pick === 'away') return `MT ${teamAway}`;
      return 'MT nul';
    case 'handicap': {
      const team = options.side === 'home' ? teamHome : teamAway;
      const sign = options.value >= 0 ? '+' : '';
      return `${team} (${sign}${options.value})`;
    }
    case 'corners':
      return `${options.direction === 'over' ? 'Plus de' : 'Moins de'} ${options.threshold} corners`;
    case 'cards': {
      const noun = options.kind === 'yellow' ? 'jaunes' : options.kind === 'red' ? 'rouges' : 'cartons';
      return `${options.direction === 'over' ? 'Plus de' : 'Moins de'} ${options.threshold} ${noun}`;
    }
  }
}

// ============================================================
// Méta des types : titre, icône, description
// ============================================================

type TypeMeta = {
  type: ConditionType;
  icon: string; // emoji
  title: string;
  desc: string;
};

const TYPE_META: TypeMeta[] = [
  { type: 'winner', icon: '🏆', title: 'Vainqueur', desc: '1, X ou 2' },
  { type: 'over_under', icon: '⚽', title: '+/− buts', desc: 'Total du match' },
  { type: 'btts', icon: '🎯', title: 'BTTS', desc: 'Les 2 marquent' },
  { type: 'double_chance', icon: '2️⃣', title: 'Double chance', desc: '1X / X2 / 12' },
  { type: 'exact_score', icon: '🎲', title: 'Score exact', desc: 'Format X-Y' },
  { type: 'scorer', icon: '👟', title: 'Buteur', desc: 'Joueur marque' },
  { type: 'halftime', icon: '⏱️', title: 'Mi-temps', desc: 'Vainqueur ou score MT' },
  { type: 'handicap', icon: '⚖️', title: 'Handicap', desc: 'PSG (−1.5) etc.' },
  { type: 'corners', icon: '🚩', title: 'Corners', desc: '+/− de X' },
  { type: 'cards', icon: '🟨', title: 'Cartons', desc: '+/− de X' },
];

function typeLabel(type: ConditionType): string {
  return TYPE_META.find((t) => t.type === type)?.title ?? type;
}

function typeIcon(type: ConditionType): string {
  return TYPE_META.find((t) => t.type === type)?.icon ?? '•';
}

// ============================================================
// Composant principal
// ============================================================

export function BetConditionBuilder({
  teamHome,
  teamAway,
  onPredictionChange,
  initialPrediction,
}: {
  teamHome: string;
  teamAway: string;
  onPredictionChange: (predictionText: string) => void;
  initialPrediction?: string;
}) {
  const c = useThemeColors();
  const [conditions, setConditions] = useState<Condition[]>([]);

  // État UI : sheet ouvert et type sélectionné
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingType, setEditingType] = useState<ConditionType | null>(null);

  // Init avec la prédiction existante (mode édition) — pour l'instant on
  // affiche juste un fallback texte si elle n'a pas été construite via picker.
  // Sprint ultérieur : parser le texte existant pour le réinjecter en conditions.
  useEffect(() => {
    if (initialPrediction && conditions.length === 0) {
      // Pas encore d'auto-parse depuis texte. Le user devra reconstruire.
    }
  }, [initialPrediction, conditions.length]);

  // Génère le texte canonique à chaque changement
  useEffect(() => {
    const text = conditions
      .map((cd) => canonicalText(cd.options, teamHome, teamAway))
      .join(' et ');
    onPredictionChange(text);
  }, [conditions, teamHome, teamAway, onPredictionChange]);

  function addCondition(options: ConditionOptions) {
    setConditions((prev) => [
      ...prev,
      { id: String(Date.now() + Math.random()), options },
    ]);
    setEditingType(null);
    setPickerOpen(false);
  }

  function removeCondition(id: string) {
    setConditions((prev) => prev.filter((cd) => cd.id !== id));
  }

  return (
    <View style={{ gap: Spacing.two }}>
      {/* Liste des conditions */}
      {conditions.length > 0 ? (
        <View style={{ gap: Spacing.one }}>
          {conditions.map((cd, idx) => (
            <View key={cd.id}>
              {idx > 0 ? (
                <Text style={[styles.connector, { color: c.textDim }]}>+ ET +</Text>
              ) : null}
              <View
                style={[
                  styles.conditionCard,
                  { backgroundColor: c.bgDeeper, borderColor: c.borderFaint },
                ]}>
                <View style={styles.conditionTop}>
                  <View style={[styles.conditionPill, { backgroundColor: c.bgWarm }]}>
                    <Text style={[styles.conditionPillText, { color: c.gold }]}>
                      {typeIcon(cd.options.type)} {typeLabel(cd.options.type).toUpperCase()}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => removeCondition(cd.id)}
                    hitSlop={8}
                    style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
                    <SymbolView name="xmark.circle.fill" size={20} tintColor={c.danger} weight="medium" />
                  </Pressable>
                </View>
                <Text style={[styles.conditionText, { color: c.text }]}>
                  {canonicalText(cd.options, teamHome || 'Domicile', teamAway || 'Extérieur')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Bouton + Ajouter */}
      <Pressable
        onPress={() => {
          if (!teamHome || !teamAway) {
            // pas d'équipes encore : on permet quand même (les noms canoniques
            // utiliseront un placeholder qui sera substitué quand l'admin
            // remplira les équipes ensuite)
          }
          setEditingType(null);
          setPickerOpen(true);
        }}
        style={({ pressed }) => [
          styles.addBtn,
          { borderColor: c.gold, opacity: pressed ? 0.6 : 1 },
        ]}>
        <SymbolView name="plus.circle.fill" size={18} tintColor={c.gold} weight="medium" />
        <Text style={[styles.addBtnText, { color: c.gold }]}>
          {conditions.length === 0 ? 'Ajouter une condition' : 'Ajouter une autre condition'}
        </Text>
      </Pressable>

      {/* Preview */}
      {conditions.length > 0 ? (
        <View
          style={[
            styles.preview,
            { backgroundColor: c.bgWarm, borderColor: c.gold },
          ]}>
          <Text style={[styles.previewLabel, { color: c.gold }]}>PRONOSTIC GÉNÉRÉ</Text>
          <Text style={[styles.previewText, { color: c.text }]}>
            {conditions
              .map((cd) => canonicalText(cd.options, teamHome || 'Domicile', teamAway || 'Extérieur'))
              .join(' et ')}
          </Text>
          <Text style={[styles.previewMeta, { color: '#16A34A' }]}>
            ✓ Tracking auto activé · {conditions.length} condition{conditions.length > 1 ? 's' : ''}
          </Text>
        </View>
      ) : null}

      {/* Picker en PLEIN ÉCRAN — remplace le contenu, comme un vrai écran */}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setPickerOpen(false)}>
        <View style={[styles.fullScreen, { backgroundColor: c.bg }]}>
          {/* Header fixe */}
          <View style={[styles.fullHeader, { borderBottomColor: c.borderFaint }]}>
            <Pressable
              onPress={() => {
                if (editingType) setEditingType(null);
                else setPickerOpen(false);
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.fullHeaderBack, { opacity: pressed ? 0.5 : 1 }]}>
              <SymbolView name="chevron.backward" size={16} tintColor={c.gold} weight="semibold" />
              <Text style={[styles.fullHeaderBackText, { color: c.gold }]}>
                {editingType ? 'Types' : 'Annuler'}
              </Text>
            </Pressable>
            <Text style={[styles.fullHeaderTitle, { color: c.text }]} numberOfLines={1}>
              {editingType
                ? `${typeIcon(editingType)} ${typeLabel(editingType)}`
                : 'Choisis un type'}
            </Text>
            <View style={styles.fullHeaderRight} />
          </View>

          {/* Match en haut (rappel) */}
          <View style={[styles.fullMatchCard, { borderColor: c.gold }]}>
            <Text style={[styles.fullMatchTeams, { color: c.text }]} numberOfLines={1}>
              {(teamHome || 'Domicile')} <Text style={{ color: c.gold }}>vs</Text> {(teamAway || 'Extérieur')}
            </Text>
          </View>

          {/* Content scrollable */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.fullContent}>
            {editingType === null ? (
              <View style={styles.typeGrid}>
                {TYPE_META.map((m) => (
                  <Pressable
                    key={m.type}
                    onPress={() => setEditingType(m.type)}
                    style={({ pressed }) => [
                      styles.typeCard,
                      { backgroundColor: c.bgElevated, borderColor: c.borderFaint, opacity: pressed ? 0.7 : 1 },
                    ]}>
                    <Text style={styles.typeCardIcon}>{m.icon}</Text>
                    <Text style={[styles.typeCardTitle, { color: c.text }]}>{m.title}</Text>
                    <Text style={[styles.typeCardDesc, { color: c.textMuted }]}>{m.desc}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <OptionsForm
                type={editingType}
                teamHome={teamHome || 'Domicile'}
                teamAway={teamAway || 'Extérieur'}
                onConfirm={addCondition}
              />
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================
// Formulaire d'options selon le type
// ============================================================

function OptionsForm({
  type,
  teamHome,
  teamAway,
  onConfirm,
}: {
  type: ConditionType;
  teamHome: string;
  teamAway: string;
  onConfirm: (options: ConditionOptions) => void;
}) {
  const c = useThemeColors();

  if (type === 'winner') {
    return (
      <View>
        <FormQuestion label="Qui va gagner ?" />
        <Segmented
          options={[
            { value: 'home', label: teamHome },
            { value: 'draw', label: 'Nul' },
            { value: 'away', label: teamAway },
          ]}
          onPick={(v) => onConfirm({ type: 'winner', pick: v as 'home' | 'draw' | 'away' })}
        />
      </View>
    );
  }

  if (type === 'btts') {
    return (
      <View>
        <FormQuestion label="Les 2 équipes marquent ?" />
        <Segmented
          options={[
            { value: 'yes', label: 'Oui' },
            { value: 'no', label: 'Non' },
          ]}
          onPick={(v) => onConfirm({ type: 'btts', pick: v as 'yes' | 'no' })}
        />
      </View>
    );
  }

  if (type === 'double_chance') {
    return (
      <View>
        <FormQuestion label="Double chance" />
        <Segmented
          options={[
            { value: '1X', label: `${teamHome} ou nul` },
            { value: '12', label: 'Pas de nul' },
            { value: 'X2', label: `${teamAway} ou nul` },
          ]}
          onPick={(v) => onConfirm({ type: 'double_chance', pick: v as '1X' | '12' | 'X2' })}
        />
      </View>
    );
  }

  if (type === 'over_under' || type === 'corners') {
    return <ThresholdForm type={type} onConfirm={onConfirm} />;
  }

  if (type === 'cards') {
    return <CardsForm onConfirm={onConfirm} />;
  }

  if (type === 'exact_score') {
    return <ScoreForm onConfirm={(h, a) => onConfirm({ type: 'exact_score', home: h, away: a })} />;
  }

  if (type === 'scorer') {
    return <ScorerForm onConfirm={onConfirm} />;
  }

  if (type === 'halftime') {
    return <HalftimeForm teamHome={teamHome} teamAway={teamAway} onConfirm={onConfirm} />;
  }

  if (type === 'handicap') {
    return <HandicapForm teamHome={teamHome} teamAway={teamAway} onConfirm={onConfirm} />;
  }

  return (
    <Text style={{ color: c.textMuted, padding: 16 }}>
      Type non supporté
    </Text>
  );
}

// ============================================================
// Helpers UI
// ============================================================

function FormQuestion({ label }: { label: string }) {
  const c = useThemeColors();
  return (
    <Text style={[styles.formQuestion, { color: c.text }]}>{label}</Text>
  );
}

function Segmented({
  options,
  onPick,
}: {
  options: Array<{ value: string; label: string }>;
  onPick: (v: string) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.segmentedRow, { backgroundColor: c.bgDeeper, borderColor: c.borderFaint }]}>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onPick(opt.value)}
          style={({ pressed }) => [
            styles.segmentedBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}>
          <Text style={[styles.segmentedBtnText, { color: c.text }]}>{opt.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ChipGrid({
  values,
  onPick,
  selected,
}: {
  values: number[];
  onPick: (v: number) => void;
  selected?: number;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.chipGrid}>
      {values.map((v) => {
        const active = selected === v;
        return (
          <Pressable
            key={v}
            onPress={() => onPick(v)}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: active ? c.gold : c.bgDeeper,
                borderColor: active ? c.gold : c.borderFaint,
                opacity: pressed ? 0.7 : 1,
              },
            ]}>
            <Text style={[styles.chipText, { color: active ? '#0A0A0A' : c.text }]}>{v}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ThresholdForm({
  type,
  onConfirm,
}: {
  type: 'over_under' | 'corners';
  onConfirm: (options: ConditionOptions) => void;
}) {
  const c = useThemeColors();
  const [direction, setDirection] = useState<'over' | 'under'>('over');
  const [threshold, setThreshold] = useState<number | null>(null);
  const presets = type === 'over_under' ? [0.5, 1.5, 2.5, 3.5, 4.5, 5.5] : [7.5, 8.5, 9.5, 10.5, 11.5, 12.5];

  return (
    <View>
      <FormQuestion label="Direction" />
      <Segmented
        options={[
          { value: 'over', label: 'Plus de' },
          { value: 'under', label: 'Moins de' },
        ]}
        onPick={(v) => setDirection(v as 'over' | 'under')}
      />
      <FormQuestion label="Seuil" />
      <ChipGrid values={presets} onPick={(v) => setThreshold(v)} selected={threshold ?? undefined} />
      <ConfirmButton
        disabled={threshold === null}
        onPress={() => threshold !== null && onConfirm({ type, direction, threshold })}
      />
    </View>
  );
}

function CardsForm({ onConfirm }: { onConfirm: (options: ConditionOptions) => void }) {
  const [direction, setDirection] = useState<'over' | 'under'>('over');
  const [kind, setKind] = useState<'all' | 'yellow' | 'red'>('all');
  const [threshold, setThreshold] = useState<number | null>(null);
  const presets = [2.5, 3.5, 4.5, 5.5, 6.5];

  return (
    <View>
      <FormQuestion label="Type de cartons" />
      <Segmented
        options={[
          { value: 'all', label: 'Tous' },
          { value: 'yellow', label: 'Jaunes' },
          { value: 'red', label: 'Rouges' },
        ]}
        onPick={(v) => setKind(v as 'all' | 'yellow' | 'red')}
      />
      <FormQuestion label="Direction" />
      <Segmented
        options={[
          { value: 'over', label: 'Plus de' },
          { value: 'under', label: 'Moins de' },
        ]}
        onPick={(v) => setDirection(v as 'over' | 'under')}
      />
      <FormQuestion label="Seuil" />
      <ChipGrid values={presets} onPick={(v) => setThreshold(v)} selected={threshold ?? undefined} />
      <ConfirmButton
        disabled={threshold === null}
        onPress={() => threshold !== null && onConfirm({ type: 'cards', kind, direction, threshold })}
      />
    </View>
  );
}

function ScoreForm({ onConfirm }: { onConfirm: (home: number, away: number) => void }) {
  const c = useThemeColors();
  const [homeText, setHomeText] = useState('');
  const [awayText, setAwayText] = useState('');
  const h = parseInt(homeText, 10);
  const a = parseInt(awayText, 10);
  const valid = !Number.isNaN(h) && !Number.isNaN(a) && h >= 0 && a >= 0;
  return (
    <View>
      <FormQuestion label="Score exact" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 }}>
        <TextInput
          style={[styles.numInput, { backgroundColor: c.bgDeeper, color: c.text, borderColor: c.borderFaint }]}
          value={homeText}
          onChangeText={setHomeText}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="X"
          placeholderTextColor={c.textDim}
        />
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>−</Text>
        <TextInput
          style={[styles.numInput, { backgroundColor: c.bgDeeper, color: c.text, borderColor: c.borderFaint }]}
          value={awayText}
          onChangeText={setAwayText}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="Y"
          placeholderTextColor={c.textDim}
        />
      </View>
      <ConfirmButton disabled={!valid} onPress={() => valid && onConfirm(h, a)} />
    </View>
  );
}

function ScorerForm({ onConfirm }: { onConfirm: (options: ConditionOptions) => void }) {
  const c = useThemeColors();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'any' | 'first' | 'last'>('any');
  return (
    <View>
      <FormQuestion label="Nom du joueur" />
      <TextInput
        style={[styles.textInput, { backgroundColor: c.bgDeeper, color: c.text, borderColor: c.borderFaint }]}
        value={name}
        onChangeText={setName}
        placeholder="Ex. Mbappé, Gutierrez…"
        placeholderTextColor={c.textDim}
      />
      <Text style={[styles.helper, { color: c.textDim }]}>
        Tu peux saisir juste le nom de famille — le tracker matche tolérant (accents, "L. Gutierrez" etc.).
      </Text>
      <FormQuestion label="Type de pari" />
      <Segmented
        options={[
          { value: 'any', label: 'Marque' },
          { value: 'first', label: '1er buteur' },
          { value: 'last', label: 'Dernier' },
        ]}
        onPick={(v) => setMode(v as 'any' | 'first' | 'last')}
      />
      <ConfirmButton
        disabled={name.trim().length < 2}
        onPress={() => onConfirm({ type: 'scorer', playerName: name.trim(), mode })}
      />
    </View>
  );
}

function HalftimeForm({
  teamHome,
  teamAway,
  onConfirm,
}: {
  teamHome: string;
  teamAway: string;
  onConfirm: (options: ConditionOptions) => void;
}) {
  const [mode, setMode] = useState<'winner' | 'score'>('winner');
  const [homeText, setHomeText] = useState('');
  const [awayText, setAwayText] = useState('');
  const c = useThemeColors();

  return (
    <View>
      <FormQuestion label="Type de pari" />
      <Segmented
        options={[
          { value: 'winner', label: 'Vainqueur MT' },
          { value: 'score', label: 'Score MT' },
        ]}
        onPick={(v) => setMode(v as 'winner' | 'score')}
      />
      {mode === 'winner' ? (
        <View>
          <FormQuestion label="Qui mène à la pause ?" />
          <Segmented
            options={[
              { value: 'home', label: teamHome },
              { value: 'draw', label: 'Nul' },
              { value: 'away', label: teamAway },
            ]}
            onPick={(v) =>
              onConfirm({ type: 'halftime', mode: 'winner', pick: v as 'home' | 'draw' | 'away' })
            }
          />
        </View>
      ) : (
        <View>
          <FormQuestion label="Score à la mi-temps" />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 12 }}>
            <TextInput
              style={[styles.numInput, { backgroundColor: c.bgDeeper, color: c.text, borderColor: c.borderFaint }]}
              value={homeText}
              onChangeText={setHomeText}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="X"
              placeholderTextColor={c.textDim}
            />
            <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>−</Text>
            <TextInput
              style={[styles.numInput, { backgroundColor: c.bgDeeper, color: c.text, borderColor: c.borderFaint }]}
              value={awayText}
              onChangeText={setAwayText}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="Y"
              placeholderTextColor={c.textDim}
            />
          </View>
          {(() => {
            const h = parseInt(homeText, 10);
            const a = parseInt(awayText, 10);
            const valid = !Number.isNaN(h) && !Number.isNaN(a) && h >= 0 && a >= 0;
            return (
              <ConfirmButton
                disabled={!valid}
                onPress={() => valid && onConfirm({ type: 'halftime', mode: 'score', home: h, away: a })}
              />
            );
          })()}
        </View>
      )}
    </View>
  );
}

function HandicapForm({
  teamHome,
  teamAway,
  onConfirm,
}: {
  teamHome: string;
  teamAway: string;
  onConfirm: (options: ConditionOptions) => void;
}) {
  const [side, setSide] = useState<'home' | 'away'>('home');
  const [value, setValue] = useState<number | null>(null);
  const presets = [-2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2];
  return (
    <View>
      <FormQuestion label="Équipe" />
      <Segmented
        options={[
          { value: 'home', label: teamHome },
          { value: 'away', label: teamAway },
        ]}
        onPick={(v) => setSide(v as 'home' | 'away')}
      />
      <FormQuestion label="Handicap" />
      <ChipGrid values={presets} onPick={(v) => setValue(v)} selected={value ?? undefined} />
      <ConfirmButton
        disabled={value === null}
        onPress={() => value !== null && onConfirm({ type: 'handicap', side, value })}
      />
    </View>
  );
}

function ConfirmButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.confirmBtn,
        {
          backgroundColor: disabled ? c.bgDeeper : c.gold,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[
          styles.confirmBtnText,
          { color: disabled ? c.textDim : '#0A0A0A' },
        ]}>
        Ajouter au pari
      </Text>
    </Pressable>
  );
}

// ============================================================
// Styles
// ============================================================

const styles = StyleSheet.create({
  // Conditions list
  conditionCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  conditionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  conditionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  conditionPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  conditionText: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  connector: {
    textAlign: 'center',
    fontSize: 10,
    letterSpacing: 1.2,
    fontWeight: '700',
    paddingVertical: 4,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  preview: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  previewText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  previewMeta: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
  },

  // Picker plein écran
  fullScreen: {
    flex: 1,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 14,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fullHeaderBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  fullHeaderBackText: {
    fontSize: 15,
    fontWeight: '700',
  },
  fullHeaderTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  fullHeaderRight: {
    minWidth: 90,
  },
  fullMatchCard: {
    margin: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  fullMatchTeams: {
    fontSize: 14,
    fontWeight: '800',
  },
  fullContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typeCardIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  typeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  typeCardDesc: {
    fontSize: 10,
    marginTop: 2,
  },

  // Forms
  formQuestion: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 8,
  },
  segmentedRow: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  segmentedBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  segmentedBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  numInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    marginVertical: 6,
  },
  helper: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },
  confirmBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
