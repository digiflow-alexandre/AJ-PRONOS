import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
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

import {
  AdminPickerSheet,
  type PickerOption,
} from '@/components/admin-picker-sheet';
import { FOOT_COMPETITIONS, getFlagUrl } from '@/constants/competitions';
import { Radius, Spacing } from '@/constants/theme';
import { formatLongDate } from '@/lib/format-date';
import { displayTeamName } from '@/lib/team-display-names';
import { useTennisCompetitions, type TennisCompetition } from '@/lib/use-tennis-competitions';
import { useUpcomingMatches } from '@/lib/use-upcoming-matches';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { MatchRow } from '@/types/match';

/**
 * Sélecteur de match depuis la table `matches` (peuplée par l'Edge Function
 * fetch-matches). Permet à Julien de choisir un match à venir au lieu de
 * saisir manuellement compétition + équipes + date + heure.
 */
export function AdminMatchPicker({
  value,
  onSelect,
  onClear,
  onSwitchToManual,
}: {
  /** Match actuellement sélectionné. null = aucun. */
  value: MatchRow | null;
  /** Appelé quand l'admin sélectionne un match. */
  onSelect: (match: MatchRow) => void;
  /** Appelé pour vider la sélection. */
  onClear: () => void;
  /** Appelé pour passer en mode "saisie manuelle". */
  onSwitchToManual: () => void;
}) {
  const c = useThemeColors();
  const [open, setOpen] = useState(false);

  // Vue sélectionnée
  if (value) {
    return (
      <View
        style={[
          styles.selectedCard,
          { backgroundColor: c.bgWarm, borderColor: c.gold },
        ]}>
        <View style={styles.selectedHeader}>
          <Text style={[styles.selectedComp, { color: c.gold }]}>
            {value.competition_label}
            {value.competition_etape ? ` · ${value.competition_etape}` : ''}
          </Text>
          <Pressable
            onPress={onClear}
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}>
            <SymbolView
              name="xmark.circle.fill"
              size={20}
              tintColor={c.textMuted}
              weight="medium"
            />
          </Pressable>
        </View>
        <View style={styles.selectedTeams}>
          <View style={styles.selectedTeam}>
            {value.team_home_logo ? (
              <Image
                source={{ uri: value.team_home_logo }}
                style={styles.selectedLogo}
                contentFit="contain"
              />
            ) : null}
            <Text style={[styles.selectedTeamName, { color: c.text }]} numberOfLines={1}>
              {displayTeamName(value.team_home)}
            </Text>
          </View>
          <Text style={[styles.selectedVs, { color: c.textDim }]}>VS</Text>
          <View style={[styles.selectedTeam, { alignItems: 'flex-end' }]}>
            {value.team_away_logo ? (
              <Image
                source={{ uri: value.team_away_logo }}
                style={styles.selectedLogo}
                contentFit="contain"
              />
            ) : null}
            <Text
              style={[styles.selectedTeamName, { color: c.text }]}
              numberOfLines={1}>
              {displayTeamName(value.team_away)}
            </Text>
          </View>
        </View>
        <Text style={[styles.selectedDate, { color: c.textMuted }]}>
          {formatLongDate(value.match_start_at)} · {formatTime(value.match_start_at)}
        </Text>
      </View>
    );
  }

  // Vue "pas de sélection"
  return (
    <View style={{ gap: Spacing.two }}>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.pickerBtn,
          {
            backgroundColor: c.bgElevated,
            borderColor: c.borderSoft,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
        <SymbolView
          name="calendar.badge.plus"
          size={20}
          tintColor={c.gold}
          weight="semibold"
        />
        <Text style={[styles.pickerBtnText, { color: c.text }]}>
          Choisir un match à venir
        </Text>
        <SymbolView
          name="chevron.right"
          size={14}
          tintColor={c.textDim}
          weight="medium"
        />
      </Pressable>
      <Pressable
        onPress={onSwitchToManual}
        hitSlop={6}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
          alignSelf: 'center',
          paddingVertical: 4,
        })}>
        <Text style={[styles.manualLink, { color: c.textMuted }]}>
          Saisir manuellement
        </Text>
      </Pressable>

      <MatchPickerSheet
        visible={open}
        onSelect={(m) => {
          onSelect(m);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}

// =============================================================================
// Bottom sheet : liste des matchs filtré par compétition
// =============================================================================
function MatchPickerSheet({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (match: MatchRow) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  // Step préliminaire : on demande d'abord le sport pour ne pas mélanger
  // les matchs foot et tennis dans la liste (UX + filtres incompatibles).
  const [selectedSport, setSelectedSport] = useState<'foot' | 'tennis' | null>(null);
  const [competitionFilter, setCompetitionFilter] = useState<string | null>(null);
  const [compPickerOpen, setCompPickerOpen] = useState(false);

  // Reset à chaque fermeture du sheet
  useEffect(() => {
    if (!visible) {
      setSelectedSport(null);
      setCompetitionFilter(null);
    }
  }, [visible]);

  // Liste des tournois tennis avec matchs à venir (dynamique depuis DB)
  const tennisCompetitions = useTennisCompetitions();

  // Mapping surface tennis → libellé FR pour le sous-titre du picker
  const surfaceLabel: Record<NonNullable<TennisCompetition['surface']>, string> = {
    clay: 'Terre battue',
    grass: 'Gazon',
    hard: 'Dur',
    hard_indoor: 'Dur (indoor)',
    carpet: 'Moquette',
  };

  // Fallback logo : si pas de drapeau pays (UEFA, internationales, etc.),
  // on utilise le logo officiel de la ligue via API-Football.
  const compLogoFor = (countryCode: string | undefined, apiLeagueId: number) =>
    countryCode
      ? getFlagUrl(countryCode)
      : `https://media.api-sports.io/football/leagues/${apiLeagueId}.png`;

  // Compétition actuellement sélectionnée (résolue dans la bonne source selon sport)
  const selectedComp = useMemo(() => {
    if (!competitionFilter) return null;
    if (selectedSport === 'foot') {
      const c = FOOT_COMPETITIONS.find((c) => c.id === competitionFilter);
      return c ? { id: c.id, label: c.label, kind: 'foot' as const, footComp: c } : null;
    }
    if (selectedSport === 'tennis') {
      const t = tennisCompetitions.find((t) => t.id === competitionFilter);
      return t ? { id: t.id, label: t.label, kind: 'tennis' as const, tennisComp: t } : null;
    }
    return null;
  }, [competitionFilter, selectedSport, tennisCompetitions]);

  const compOptions: PickerOption[] = useMemo(() => {
    if (selectedSport === 'tennis') {
      return [
        { id: '__all__', label: 'Tous les tournois', iconFallback: 'tennis.racket' },
        ...tennisCompetitions.map((t) => ({
          id: t.id,
          label: t.label,
          subtitle: t.surface ? surfaceLabel[t.surface] : undefined,
          iconFallback: 'tennis.racket',
        })),
      ];
    }
    return [
      { id: '__all__', label: 'Toutes les compétitions' },
      ...FOOT_COMPETITIONS.filter((c) => c.apiLeagueId != null).map((comp) => ({
        id: comp.id,
        label: comp.label,
        imageUrl: compLogoFor(comp.countryCode, comp.apiLeagueId!),
        subtitle: comp.countryCode?.toUpperCase() ?? 'UEFA',
      })),
    ];
  }, [selectedSport, tennisCompetitions]);
  const { matches, isLoading } = useUpcomingMatches({
    sport: selectedSport ?? undefined,
    competitionId: competitionFilter ?? undefined,
    // 200 = assez large pour absorber un tournoi complet (Mondial = 104 matchs)
    // sans risque de perf — c'est juste une liste admin paginée visuellement.
    limit: 200,
  });

  // Groupage par jour pour affichage
  const matchesByDay = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of matches) {
      const day = m.match_start_at.slice(0, 10); // YYYY-MM-DD
      const list = map.get(day) ?? [];
      list.push(m);
      map.set(day, list);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [matches]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.sheet,
              {
                backgroundColor: c.bgElevated,
                paddingBottom: insets.bottom + Spacing.three,
                borderTopColor: c.borderSoft,
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: c.borderStrong }]} />
            <View style={styles.sheetHeaderPadded}>
              {selectedSport ? (
                <Pressable
                  onPress={() => {
                    setSelectedSport(null);
                    setCompetitionFilter(null);
                  }}
                  hitSlop={6}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.5 : 1,
                    marginBottom: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                  })}>
                  <SymbolView
                    name="chevron.left"
                    size={12}
                    tintColor={c.textMuted}
                    weight="medium"
                  />
                  <Text style={{ color: c.textMuted, fontSize: 12 }}>
                    Changer de sport
                  </Text>
                </Pressable>
              ) : null}
              <Text style={[styles.sheetTitle, { color: c.text }]}>
                {selectedSport === 'foot'
                  ? 'Match de football'
                  : selectedSport === 'tennis'
                    ? 'Match de tennis'
                    : 'Choisir un match'}
              </Text>
            </View>

            {/* STEP 1 : choix du sport — affiché tant qu'aucun sport sélectionné */}
            {!selectedSport ? (
              <View style={styles.sportPickerRow}>
                <Pressable
                  onPress={() => setSelectedSport('foot')}
                  style={({ pressed }) => [
                    styles.sportCard,
                    {
                      backgroundColor: c.bgDeeper,
                      borderColor: c.borderSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="soccerball"
                    size={36}
                    tintColor={c.gold}
                    weight="medium"
                  />
                  <Text style={[styles.sportCardLabel, { color: c.text }]}>
                    Football
                  </Text>
                  <Text style={[styles.sportCardSub, { color: c.textMuted }]}>
                    Top 5 + UEFA + Mondial…
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setSelectedSport('tennis')}
                  style={({ pressed }) => [
                    styles.sportCard,
                    {
                      backgroundColor: c.bgDeeper,
                      borderColor: c.borderSoft,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <SymbolView
                    name="tennis.racket"
                    size={36}
                    tintColor={c.gold}
                    weight="medium"
                  />
                  <Text style={[styles.sportCardLabel, { color: c.text }]}>
                    Tennis
                  </Text>
                  <Text style={[styles.sportCardSub, { color: c.textMuted }]}>
                    ATP + WTA · simple & double
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Filtre par compétition (foot) ou par tournoi (tennis) */}
            {selectedSport ? (
            <View style={styles.compFilterRow}>
              <Pressable
                onPress={() => setCompPickerOpen(true)}
                style={({ pressed }) => [
                  styles.compFilterBtn,
                  {
                    backgroundColor: c.bgDeeper,
                    borderColor: selectedComp ? c.gold : c.borderSoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                {selectedComp?.kind === 'foot' ? (
                  <Image
                    source={{
                      uri: compLogoFor(
                        selectedComp.footComp.countryCode,
                        selectedComp.footComp.apiLeagueId!,
                      ),
                    }}
                    style={styles.compFilterFlag}
                    contentFit="contain"
                  />
                ) : selectedComp?.kind === 'tennis' ? (
                  <SymbolView
                    name="tennis.racket"
                    size={14}
                    tintColor={c.gold}
                    weight="medium"
                  />
                ) : (
                  <SymbolView
                    name="line.3.horizontal.decrease.circle"
                    size={14}
                    tintColor={c.textMuted}
                    weight="medium"
                  />
                )}
                <Text
                  style={[
                    styles.compFilterLabel,
                    { color: selectedComp ? c.gold : c.text },
                  ]}
                  numberOfLines={1}>
                  {selectedComp
                    ? selectedComp.label
                    : selectedSport === 'tennis'
                      ? 'Tous les tournois'
                      : 'Toutes les compétitions'}
                </Text>
                <SymbolView
                  name="chevron.down"
                  size={11}
                  tintColor={c.textDim}
                  weight="medium"
                />
              </Pressable>
              {selectedComp ? (
                <Pressable
                  onPress={() => setCompetitionFilter(null)}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.compFilterClear,
                    { opacity: pressed ? 0.5 : 1 },
                  ]}>
                  <SymbolView
                    name="xmark.circle.fill"
                    size={20}
                    tintColor={c.textMuted}
                    weight="medium"
                  />
                </Pressable>
              ) : null}
            </View>
            ) : null}

            {/* Liste des matchs — affichée uniquement quand un sport est sélectionné */}
            {selectedSport ? (
            <ScrollView
              style={styles.list}
              contentContainerStyle={[
                styles.listContent,
                { paddingHorizontal: Spacing.four },
              ]}
              showsVerticalScrollIndicator={false}>
              {isLoading ? (
                <Text style={[styles.emptyText, { color: c.textDim }]}>
                  Chargement…
                </Text>
              ) : matches.length === 0 ? (
                <View style={styles.emptyBlock}>
                  <Text style={[styles.emptyTitle, { color: c.text }]}>
                    Aucun match à venir.
                  </Text>
                  <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                    {competitionFilter
                      ? 'Aucun match prévu dans cette compétition. Change de filtre ou saisis manuellement.'
                      : selectedSport === 'tennis'
                        ? 'Pas de matchs tennis dans les prochains jours, ou la sync API tennis n’a pas encore tourné.'
                        : 'La base API-Football n’a pas encore été rafraîchie aujourd’hui, ou aucun match prévu dans les 3 prochains jours.'}
                  </Text>
                </View>
              ) : (
                matchesByDay.map(([day, dayMatches]) => (
                  <View key={day} style={styles.dayGroup}>
                    <Text style={[styles.dayLabel, { color: c.gold }]}>
                      — {formatLongDate(day).toUpperCase()}
                    </Text>
                    {dayMatches.map((m) => (
                      <MatchRowItem key={m.id} match={m} onPress={() => onSelect(m)} />
                    ))}
                  </View>
                ))
              )}
            </ScrollView>
            ) : null}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>

      {/* Sheet picker compétition (imbriqué, ouvert depuis le bouton filtre) */}
      <AdminPickerSheet
        visible={compPickerOpen}
        title={selectedSport === 'tennis' ? 'Filtrer par tournoi' : 'Filtrer par compétition'}
        options={compOptions}
        searchPlaceholder={
          selectedSport === 'tennis' ? 'Rechercher un tournoi…' : 'Rechercher une compétition…'
        }
        allowCustom={false}
        onSelect={(opt) => {
          setCompetitionFilter(opt.id === '__all__' ? null : opt.id);
          setCompPickerOpen(false);
        }}
        onClose={() => setCompPickerOpen(false)}
      />
    </Modal>
  );
}

function CompChip({
  label,
  flagUrl,
  selected,
  onPress,
}: {
  label: string;
  flagUrl?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.compChip,
        {
          backgroundColor: selected ? c.bgWarm : c.bgDeeper,
          borderColor: selected ? c.gold : c.borderSoft,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      {flagUrl ? (
        <Image
          source={{ uri: flagUrl }}
          style={styles.compChipFlag}
          contentFit="contain"
        />
      ) : null}
      <Text
        style={[
          styles.compChipText,
          {
            color: selected ? c.text : c.textMuted,
            fontWeight: selected ? '700' : '500',
          },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function MatchRowItem({
  match,
  onPress,
}: {
  match: MatchRow;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.matchRow,
        {
          backgroundColor: c.bgDeeper,
          borderColor: c.borderFaint,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <View style={styles.matchHead}>
        <Text style={[styles.matchComp, { color: c.textDim }]} numberOfLines={1}>
          {match.competition_label}
          {match.competition_etape ? ` · ${match.competition_etape}` : ''}
        </Text>
        <Text style={[styles.matchTime, { color: c.text }]}>
          {formatTime(match.match_start_at)}
        </Text>
      </View>
      <View style={styles.matchTeams}>
        <View style={styles.matchTeam}>
          {match.team_home_logo ? (
            <Image
              source={{ uri: match.team_home_logo }}
              style={styles.matchLogo}
              contentFit="contain"
            />
          ) : null}
          <Text style={[styles.matchTeamName, { color: c.text }]} numberOfLines={1}>
            {displayTeamName(match.team_home)}
          </Text>
        </View>
        <Text style={[styles.matchVs, { color: c.textDim }]}>VS</Text>
        <View style={[styles.matchTeam, { justifyContent: 'flex-end' }]}>
          <Text
            style={[styles.matchTeamName, { color: c.text, textAlign: 'right' }]}
            numberOfLines={1}>
            {displayTeamName(match.team_away)}
          </Text>
          {match.team_away_logo ? (
            <Image
              source={{ uri: match.team_away_logo }}
              style={styles.matchLogo}
              contentFit="contain"
            />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

const styles = StyleSheet.create({
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  pickerBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  manualLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  // === Vue sélectionnée ===
  selectedCard: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedComp: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  selectedTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  selectedTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectedLogo: {
    width: 28,
    height: 28,
  },
  selectedTeamName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  selectedVs: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  selectedDate: {
    fontSize: 13,
    marginTop: 4,
  },
  // === Sheet ===
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    paddingTop: Spacing.two,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: '85%',
    gap: Spacing.three,
  },
  sheetHeaderPadded: {
    paddingHorizontal: Spacing.four,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  compChipsScroll: {
    flexShrink: 0,
    flexGrow: 0,
    height: 48,
  },
  compChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: Spacing.four,
    paddingRight: Spacing.four * 3,
  },
  // === Bouton filtre compétition (nouveau design) ===
  compFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.four,
  },
  compFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    borderWidth: 1.2,
  },
  compFilterFlag: {
    width: 18,
    height: 14,
    borderRadius: 2,
  },
  compFilterLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  compFilterClear: {
    padding: 4,
  },
  compChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  compChipFlag: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  compChipText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    includeFontPadding: false,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    gap: Spacing.three,
    paddingBottom: Spacing.three,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  emptyBlock: {
    paddingVertical: Spacing.four,
    gap: Spacing.two,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  sportPickerRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  sportCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    gap: 8,
  },
  sportCardLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sportCardSub: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 15,
  },
  dayGroup: {
    gap: 6,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  matchRow: {
    padding: Spacing.two,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  matchHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchComp: {
    fontSize: 11,
    flex: 1,
  },
  matchTime: {
    fontSize: 12,
    fontWeight: '700',
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  matchLogo: {
    width: 22,
    height: 22,
  },
  matchTeamName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  matchVs: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
