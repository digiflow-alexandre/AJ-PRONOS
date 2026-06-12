import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdminComboEditSheet } from '@/components/admin-combo-edit-sheet';
import { HomeStickyTopBar } from '@/components/home-hero';
import { ScorePromptSheet } from '@/components/score-prompt-sheet';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { formatLongDate } from '@/lib/format-date';
import { supabase } from '@/lib/supabase';
import { usePublishedBets } from '@/lib/use-published-bets';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { getBetStartDate } from '@/types/prono';
import type { AnyBet } from '@/types/prono';

type AdminTab = 'upcoming' | 'live' | 'finished' | 'all';

export default function AdminIndexScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isStaff } = useProfile();
  const { bets, isLoading, error, deleteBet, refresh, updateResult } =
    usePublishedBets();

  // Sheet d'édition pour les combos (vue avancée par sélection)
  const [comboEditState, setComboEditState] = useState<AnyBet | null>(null);

  // Filtres + recherche pour la liste
  const [activeTab, setActiveTab] = useState<AdminTab>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Stats : ROI 7 jours, total publiés, en attente
  const stats = useMemo(() => computeAdminStats(bets), [bets]);

  // Compteurs par tab (avant filtre search)
  const tabCounts = useMemo(() => {
    let upcoming = 0, live = 0, finished = 0;
    for (const b of bets) {
      if (isBetLive(b)) live++;
      else if (b.result === 'pending') upcoming++;
      else finished++;
    }
    return { upcoming, live, finished, all: bets.length };
  }, [bets]);

  // Bets filtrés par tab + search
  const filteredBets = useMemo(() => {
    let list = bets;
    if (activeTab === 'upcoming') list = list.filter((b) => b.result === 'pending' && !isBetLive(b));
    else if (activeTab === 'live') list = list.filter((b) => isBetLive(b));
    else if (activeTab === 'finished')
      list = list.filter((b) =>
        (b.result === 'win' || b.result === 'loss' || b.result === 'void') && !isBetLive(b),
      );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((b) => buildSearchableString(b).includes(q));
    }
    return list;
  }, [bets, activeTab, searchQuery]);

  // Group par jour (date locale YYYY-MM-DD)
  const groupedByDay = useMemo(() => {
    const groups = new Map<string, AnyBet[]>();
    for (const b of filteredBets) {
      const key = localDayKey(new Date(getBetStartDate(b)));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(b);
    }
    // Tri : à venir = ascendant (le plus proche en premier), terminés = descendant
    const sortedKeys = Array.from(groups.keys()).sort((a, b) =>
      activeTab === 'finished' ? b.localeCompare(a) : a.localeCompare(b),
    );
    return sortedKeys.map((key) => ({ key, label: friendlyDayLabel(key), bets: groups.get(key)! }));
  }, [filteredBets, activeTab]);

  function openModifyChoice(bet: AnyBet) {
    // Combos → sheet avancé (édition par sélection + recalcul cote ajustée)
    // Singles → Alert simple à 3 choix (Gagné / Perdu / Annulé)
    if (bet.type === 'combo') {
      setComboEditState(bet);
      return;
    }
    const currentLabel =
      bet.result === 'win'
        ? 'Gagné'
        : bet.result === 'loss'
          ? 'Perdu'
          : bet.result === 'void'
            ? 'Annulé'
            : bet.result;
    Alert.alert(
      'Modifier le résultat',
      `Le pari est actuellement ${currentLabel}. Choisis le nouveau statut.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: '✓ Gagné', onPress: () => markResult(bet, 'win') },
        { text: '✗ Perdu', onPress: () => markResult(bet, 'loss') },
        {
          text: '⊘ Annulé',
          style: 'destructive',
          onPress: () => markVoid(bet),
        },
      ],
    );
  }

  // Mark void = pari annulé (match reporté/abandonné, force majeure).
  // Pas besoin de score → on update direct sans passer par le ScorePromptSheet.
  async function markVoid(bet: AnyBet) {
    Alert.alert(
      'Marquer comme annulé ?',
      'Le pari (et toutes ses sélections pour un combo) sera marqué annulé. La mise est remboursée — il est exclu du calcul ROI.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            const { error: err } = await updateResult(bet.id, 'void');
            if (err) Alert.alert('Erreur', err);
          },
        },
      ],
    );
  }

  // === State pour le sheet de saisie du score ===
  // On stocke le bet en cours, le result (win/loss) et l'index de la
  // sélection courante (utile pour les combos qu'on traite séquentiellement).
  const [scoreSheetState, setScoreSheetState] = useState<{
    bet: AnyBet;
    result: 'win' | 'loss';
    selectionIndex: number;
    /** Scores accumulés par position pour les combos. */
    scoresBySelection: Record<number, string | undefined>;
  } | null>(null);

  function markResult(bet: AnyBet, result: 'win' | 'loss') {
    // On ouvre le ScorePromptSheet — qui sait gérer single + combo
    // (avec chainage entre sélections en interne).
    setScoreSheetState({
      bet,
      result,
      selectionIndex: 0,
      scoresBySelection: {},
    });
  }

  async function handleScoreValidated(score: string | undefined) {
    if (!scoreSheetState) return;
    const { bet, result, selectionIndex, scoresBySelection } = scoreSheetState;

    if (bet.type === 'single') {
      // Single : on update direct et on ferme.
      setScoreSheetState(null);
      const { error: err } = await updateResult(bet.id, result, score);
      if (err) Alert.alert('Erreur', err);
      return;
    }

    // Combo : on accumule + on passe à la sélection suivante OU finalize.
    const nextScores = { ...scoresBySelection, [selectionIndex]: score };
    const nextIndex = selectionIndex + 1;
    if (nextIndex < bet.selections.length) {
      setScoreSheetState({
        ...scoreSheetState,
        selectionIndex: nextIndex,
        scoresBySelection: nextScores,
      });
      return;
    }
    // Dernière sélection → finalize en DB
    setScoreSheetState(null);
    await finalizeCombo(bet.id, result, nextScores);
  }

  async function finalizeCombo(
    betId: string,
    result: 'win' | 'loss',
    scoresBySelection: Record<number, string | undefined>,
  ) {
    const nowISO = new Date().toISOString();
    // Update bet global (avec updated_at = now → utile au DailyRecapModal)
    const { error: gErr } = await supabase
      .from('published_bets')
      .update({ result, updated_at: nowISO })
      .eq('id', betId);
    if (gErr) {
      Alert.alert('Erreur', gErr.message);
      return;
    }
    // Update chaque sélection avec son score propre
    const { data: sels } = await supabase
      .from('published_bet_selections')
      .select('id, position')
      .eq('published_bet_id', betId);
    if (!sels) {
      refresh();
      return;
    }
    for (const s of sels as { id: string; position: number }[]) {
      const score = scoresBySelection[s.position];
      const update: Record<string, string | null> = {
        result,
        updated_at: nowISO,
      };
      if (score !== undefined) update.final_score = score;
      await supabase
        .from('published_bet_selections')
        .update(update)
        .eq('id', s.id);
    }
    refresh();
  }

  // Sécurité : si non-staff arrive ici par mégarde (URL directe), on refuse.
  if (!isStaff) {
    return (
      <View style={[styles.screen, { backgroundColor: c.bg }]}>
        <View style={styles.lockedBlock}>
          <Text style={[styles.lockedTitle, { color: c.text }]}>
            Réservé à l’équipe.
          </Text>
          <Text style={[styles.lockedBody, { color: c.textMuted }]}>
            Cette section est uniquement accessible aux administrateurs
            et validateurs.
          </Text>
        </View>
      </View>
    );
  }

  function confirmDelete(bet: AnyBet) {
    Alert.alert(
      'Supprimer ce prono ?',
      'Cette action est irréversible. Les utilisateurs ne verront plus ce pari.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteBet(bet.id);
            if (error) Alert.alert('Erreur', error);
            else refresh();
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* BG admin : logo AJ doré sur stade nuit vue terrain */}
      <ExpoImage
        source={require('@/assets/images/bg-admin.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.bgOverlay} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 80 },
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Header section */}
        <View style={styles.headerBlock}>
          <Text style={[styles.eyebrow, { color: c.gold }]}>— ADMIN</Text>
          <Text style={[styles.h1, { color: c.text }]}>
            Saisir un{'\n'}
            <Text style={{ color: c.gold }}>pronostic</Text>
            <Text style={{ color: c.gold }}>.</Text>
          </Text>
          <Text style={[styles.lead, { color: c.textMuted }]}>
            Publie un prono qui apparaîtra immédiatement chez les abonnés
            du tier sélectionné.
          </Text>
        </View>

        {/* CTAs création */}
        <View style={styles.ctaRow}>
          <Pressable
            onPress={() => router.push('/(app)/admin/new-single')}
            style={({ pressed }) => [
              styles.ctaCard,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.borderSoft,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={[styles.ctaIconBubble, { backgroundColor: c.gold }]}>
              <SymbolView
                name="plus"
                size={18}
                tintColor="#0A0A0A"
                weight="bold"
              />
            </View>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, { color: c.text }]}>
                Nouveau prono
              </Text>
              <Text style={[styles.ctaSub, { color: c.textMuted }]}>
                Pari simple
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/admin/new-combo')}
            style={({ pressed }) => [
              styles.ctaCard,
              {
                backgroundColor: c.bgElevated,
                borderColor: c.gold,
                shadowColor: c.gold,
                shadowOpacity: 0.4,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 0 },
                elevation: 4,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <View style={[styles.ctaIconBubble, { backgroundColor: c.gold }]}>
              <SymbolView
                name="square.stack.3d.up.fill"
                size={18}
                tintColor="#0A0A0A"
                weight="bold"
              />
            </View>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, { color: c.text }]}>
                Nouveau combiné
              </Text>
              <Text style={[styles.ctaSub, { color: c.textMuted }]}>
                2+ sélections
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Stats ribbon */}
        {!isLoading && !error && bets.length > 0 ? (
          <View style={styles.statsRibbon}>
            <View style={[styles.statMini, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
              <Text style={[styles.statMiniLabel, { color: c.textDim }]}>PERF 7J</Text>
              <Text style={[
                styles.statMiniValue,
                {
                  color: stats.perf7days
                    ? stats.perf7days.wins >= stats.perf7days.losses
                      ? c.success
                      : c.danger
                    : c.textMuted,
                },
              ]}>
                {stats.perf7days
                  ? `${stats.perf7days.wins}W·${stats.perf7days.losses}L`
                  : '—'}
              </Text>
            </View>
            <View style={[styles.statMini, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
              <Text style={[styles.statMiniLabel, { color: c.textDim }]}>PUBLIÉS</Text>
              <Text style={[styles.statMiniValue, { color: c.text }]}>{bets.length}</Text>
            </View>
            <View style={[styles.statMini, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
              <Text style={[styles.statMiniLabel, { color: c.textDim }]}>EN ATTENTE</Text>
              <Text style={[styles.statMiniValue, { color: c.gold }]}>{tabCounts.upcoming}</Text>
            </View>
          </View>
        ) : null}

        {/* Tabs */}
        {!isLoading && !error && bets.length > 0 ? (
          <View style={[styles.tabsBar, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
            <AdminTabButton label="À venir" count={tabCounts.upcoming} active={activeTab === 'upcoming'} onPress={() => setActiveTab('upcoming')} />
            <AdminTabButton label="En cours" count={tabCounts.live} active={activeTab === 'live'} onPress={() => setActiveTab('live')} />
            <AdminTabButton label="Terminés" count={tabCounts.finished} active={activeTab === 'finished'} onPress={() => setActiveTab('finished')} />
            <AdminTabButton label="Tous" count={tabCounts.all} active={activeTab === 'all'} onPress={() => setActiveTab('all')} />
          </View>
        ) : null}

        {/* Search */}
        {!isLoading && !error && bets.length > 0 ? (
          <View style={[styles.searchBar, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
            <SymbolView name="magnifyingglass" size={15} tintColor={c.textDim} weight="medium" />
            <TextInput
              style={[styles.searchInput, { color: c.text }]}
              placeholder="Rechercher (équipe, compétition…)"
              placeholderTextColor={c.textDim}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <SymbolView name="xmark.circle.fill" size={15} tintColor={c.textDim} weight="medium" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Liste */}
        <View style={styles.section}>
          {isLoading ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
              ]}>
              <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                Chargement…
              </Text>
            </View>
          ) : error ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: 'rgba(185, 28, 28, 0.08)', borderColor: c.danger },
              ]}>
              <Text style={[styles.emptyTitle, { color: c.danger }]}>
                Erreur de chargement
              </Text>
              <Text style={[styles.emptyBody, { color: c.text }]} selectable>
                {error}
              </Text>
            </View>
          ) : bets.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
              ]}>
              <View style={styles.emptyIconRow}>
                <View
                  style={[
                    styles.emptyIconWrap,
                    { backgroundColor: 'rgba(232,201,90,0.12)' },
                  ]}>
                  <SymbolView
                    name="calendar"
                    size={20}
                    tintColor={c.gold}
                    weight="semibold"
                  />
                </View>
                <View style={styles.emptyTextWrap}>
                  <Text style={[styles.emptyTitle, { color: c.text }]}>
                    Aucun prono publié pour le moment.
                  </Text>
                  <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                    Clique sur « Nouveau prono » ou « Nouveau combiné »
                    pour publier ton premier pronostic.
                  </Text>
                </View>
              </View>
            </View>
          ) : groupedByDay.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
              ]}>
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                Aucun pari ne correspond
              </Text>
              <Text style={[styles.emptyBody, { color: c.textMuted }]}>
                Essaie de changer de filtre ou de vider la recherche.
              </Text>
            </View>
          ) : (
            <View style={{ gap: Spacing.three }}>
              {groupedByDay.map((group) => (
                <View key={group.key}>
                  <View style={styles.dayHead}>
                    <Text style={[styles.dayHeadLabel, { color: c.textDim }]}>{group.label}</Text>
                    <Text style={[styles.dayHeadMeta, { color: c.textDim }]}>
                      {group.bets.length} prono{group.bets.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.rowList, { backgroundColor: c.bgElevated, borderColor: c.borderSoft }]}>
                    {group.bets.map((b, idx) => (
                      <AdminCompactRow
                        key={b.id}
                        bet={b}
                        isLast={idx === group.bets.length - 1}
                        onPress={() =>
                          router.push({
                            pathname: '/(app)/pronos/[id]',
                            params: { id: b.id },
                          })
                        }
                        onEdit={() => openModifyChoice(b)}
                        onDelete={() => confirmDelete(b)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky top bar */}
      <View style={styles.stickyBarWrap} pointerEvents="box-none">
        <HomeStickyTopBar />
      </View>

      {/* Sheet de saisie du score (overlay au-dessus du screen) */}
      {scoreSheetState ? (
        <ScorePromptSheet
          visible
          sport={
            scoreSheetState.bet.type === 'single'
              ? scoreSheetState.bet.sport === 'tennis'
                ? 'tennis'
                : 'foot'
              : scoreSheetState.bet.selections[scoreSheetState.selectionIndex]
                    ?.sport === 'tennis'
                ? 'tennis'
                : 'foot'
          }
          title={
            scoreSheetState.bet.type === 'single'
              ? `Marquer ${scoreSheetState.result === 'win' ? 'gagné' : 'perdu'}`
              : `Match ${scoreSheetState.selectionIndex + 1}/${scoreSheetState.bet.selections.length} · score ?`
          }
          subtitle={
            scoreSheetState.bet.type === 'single'
              ? `${scoreSheetState.bet.teamHome} vs ${scoreSheetState.bet.teamAway}`
              : (() => {
                  const sel =
                    scoreSheetState.bet.selections[scoreSheetState.selectionIndex];
                  return sel ? `${sel.teamHome} vs ${sel.teamAway}` : undefined;
                })()
          }
          validateLabel={
            scoreSheetState.bet.type === 'combo' &&
            scoreSheetState.selectionIndex <
              scoreSheetState.bet.selections.length - 1
              ? 'Suivant'
              : 'Valider'
          }
          allowSkip={scoreSheetState.bet.type === 'combo'}
          onValidate={handleScoreValidated}
          onClose={() => setScoreSheetState(null)}
        />
      ) : null}

      {/* Sheet d'édition par sélection pour les combos */}
      <AdminComboEditSheet
        visible={comboEditState !== null}
        combo={
          comboEditState?.type === 'combo' ? comboEditState : null
        }
        onClose={() => setComboEditState(null)}
        onSaved={() => refresh()}
      />
    </View>
  );
}

// ===========================================================
// Stats helpers
// ===========================================================

function computeAdminStats(bets: AnyBet[]): {
  perf7days: { wins: number; losses: number } | null;
} {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  let wins = 0;
  let losses = 0;
  for (const b of bets) {
    if (b.result !== 'win' && b.result !== 'loss') continue;
    const ts = new Date(getBetStartDate(b)).getTime();
    if (ts < sevenDaysAgo) continue;
    if (b.result === 'win') wins++;
    else losses++;
  }
  if (wins + losses === 0) return { perf7days: null };
  return { perf7days: { wins, losses } };
}

/**
 * Un pari est considéré "en cours" si soit son statut est `live` (mis à jour
 * par track-results quand l'API renvoie 1H/HT/2H), soit s'il est encore
 * `pending` mais que le coup d'envoi est passé depuis moins de 3h
 * (filet de sécurité au cas où le cron de tracking a du retard).
 */
function isBetLive(b: AnyBet): boolean {
  if (b.result === 'live') return true;
  if (b.result !== 'pending') return false;
  const startMs = new Date(getBetStartDate(b)).getTime();
  const now = Date.now();
  const threeHours = 3 * 60 * 60 * 1000;
  return startMs <= now && now - startMs < threeHours;
}

function buildSearchableString(b: AnyBet): string {
  if (b.type === 'combo') {
    return b.selections
      .map((s) => `${s.teamHome} ${s.teamAway} ${s.competition} ${s.prediction}`)
      .join(' ')
      .toLowerCase();
  }
  return `${b.teamHome} ${b.teamAway} ${b.competition} ${b.prediction}`.toLowerCase();
}

function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

function friendlyDayLabel(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = localDayKey(today);
  const tomorrow = new Date(today.getTime() + 86400000);
  const tomorrowKey = localDayKey(tomorrow);
  const yesterday = new Date(today.getTime() - 86400000);
  const yesterdayKey = localDayKey(yesterday);
  const longDate = `${DAYS_FR[date.getDay()]} ${d} ${MONTHS_FR[m - 1]}`;
  if (dayKey === todayKey) return `AUJOURD'HUI · ${longDate}`;
  if (dayKey === tomorrowKey) return `DEMAIN · ${longDate}`;
  if (dayKey === yesterdayKey) return `HIER · ${longDate}`;
  return longDate.toUpperCase();
}

function hourMinute(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ===========================================================
// AdminTabButton — petit bouton dans la barre tabs
// ===========================================================

function AdminTabButton({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabBtn,
        active ? { backgroundColor: c.gold } : null,
        { opacity: pressed ? 0.85 : 1 },
      ]}>
      <Text style={[styles.tabBtnText, { color: active ? '#0A0A0A' : c.textMuted }]}>
        {label}
      </Text>
      {count != null && count > 0 ? (
        <View style={[styles.tabBadge, { backgroundColor: active ? 'rgba(10,10,10,0.18)' : 'rgba(250,250,247,0.08)' }]}>
          <Text style={[styles.tabBadgeText, { color: active ? '#0A0A0A' : c.textMuted }]}>{count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ===========================================================
// AdminCompactRow — ligne compacte d'un pari dans la liste
// ===========================================================

function AdminCompactRow({
  bet,
  isLast,
  onPress,
  onEdit,
  onDelete,
}: {
  bet: AnyBet;
  isLast: boolean;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();
  const isCombo = bet.type === 'combo';
  const startDate = new Date(getBetStartDate(bet));
  const odd = isCombo ? bet.combinationOdd : bet.odd;

  // Titre = équipes pour single, "N matchs" pour combiné
  const title = isCombo
    ? bet.selections
        .slice(0, 2)
        .map((s) => `${s.teamHome.split(' ')[0]} · ${s.teamAway.split(' ')[0]}`)
        .join(' + ')
    : `${bet.teamHome} vs ${bet.teamAway}`;

  // Sous-titre = la prédiction (1 seule pour single, compteur pour combo)
  const subtitle = isCombo
    ? `${bet.selections.length} sélections${bet.selections.length > 2 ? ` (+${bet.selections.length - 2} match${bet.selections.length - 2 > 1 ? 's' : ''})` : ''}`
    : bet.prediction;

  // Avatar : sport pour single, ×N pour combiné
  const sport = isCombo ? bet.selections[0]?.sport : bet.sport;
  const sportIcon = sport === 'tennis' ? 'tennis.racket' : 'soccerball';

  // État pour badge (utilise la même heuristique que les compteurs tabs)
  const isLive = isBetLive(bet);

  return (
    <View style={[styles.compactRow, !isLast && { borderBottomColor: c.borderFaint, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.compactRowMain, { opacity: pressed ? 0.6 : 1 }]}>
        {/* Avatar */}
        {isCombo ? (
          <View style={[styles.compactAvatar, styles.compactAvatarCombo, { backgroundColor: c.gold }]}>
            <Text style={[styles.compactAvatarComboText, { color: '#0A0A0A' }]}>×{bet.selections.length}</Text>
          </View>
        ) : (
          <View style={[styles.compactAvatar, { backgroundColor: c.bgWarm }]}>
            <SymbolView name={sportIcon} size={18} tintColor={c.gold} weight="medium" />
          </View>
        )}

        {/* Body */}
        <View style={styles.compactBody}>
          <Text style={[styles.compactTitle, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.compactSub, { color: c.textMuted }]} numberOfLines={1}>
            {subtitle}
          </Text>
          <View style={styles.compactMetaRow}>
            <Text style={[styles.compactOdd, { color: c.gold }]}>{odd.toFixed(2)}</Text>
            <View style={styles.compactDot} />
            <View style={[styles.compactTierBadge, { backgroundColor: c.bgDeeper, borderColor: c.borderFaint }]}>
              <Text style={[styles.compactTierText, { color: c.textMuted }]}>
                {bet.minTier.toUpperCase()}
              </Text>
            </View>
            <View style={styles.compactDot} />
            {isLive ? (
              <View style={[styles.compactLiveBadge, { backgroundColor: c.danger }]}>
                <Text style={styles.compactLiveText}>LIVE</Text>
              </View>
            ) : (
              <Text style={[styles.compactTime, { color: c.textDim }]}>
                {hourMinute(startDate)}
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      {/* Actions à droite */}
      <View style={styles.compactActions}>
        <Pressable
          onPress={onEdit}
          hitSlop={6}
          style={({ pressed }) => [
            styles.compactIconBtn,
            { backgroundColor: c.bgDeeper, borderColor: c.borderFaint, opacity: pressed ? 0.5 : 1 },
          ]}>
          <SymbolView name="pencil" size={14} tintColor={c.gold} weight="medium" />
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => [
            styles.compactIconBtn,
            { backgroundColor: c.bgDeeper, borderColor: c.borderFaint, opacity: pressed ? 0.5 : 1 },
          ]}>
          <SymbolView name="trash" size={14} tintColor={c.danger} weight="medium" />
        </Pressable>
      </View>
    </View>
  );
}

function AdminBetRow({
  bet,
  onPress,
  onDelete,
  onMarkWin,
  onMarkLoss,
  onMarkVoid,
  onModify,
}: {
  bet: AnyBet;
  onPress: () => void;
  onDelete: () => void;
  onMarkWin: () => void;
  onMarkLoss: () => void;
  onMarkVoid: () => void;
  onModify: () => void;
}) {
  const c = useThemeColors();
  const isCombo = bet.type === 'combo';
  const title = isCombo
    ? `Combiné ${bet.selections.length} sélections`
    : `${bet.teamHome} - ${bet.teamAway}`;
  const odd = isCombo ? bet.combinationOdd : bet.odd;
  const resultLabel =
    bet.result === 'pending'
      ? 'À venir'
      : bet.result === 'live'
        ? 'En cours'
        : bet.result === 'win'
          ? 'Gagné'
          : bet.result === 'loss'
            ? 'Perdu'
            : 'Annulé';
  const resultColor =
    bet.result === 'win'
      ? c.success
      : bet.result === 'loss'
        ? c.danger
        : bet.result === 'live'
          ? c.gold
          : c.textDim;

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
      ]}>
      <View style={styles.rowTopLine}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.rowMain,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <View style={styles.rowHead}>
            <Text style={[styles.rowKind, { color: c.gold }]}>
              {isCombo
                ? `COMBINÉ · cote ${odd.toFixed(2)}`
                : `SIMPLE · cote ${odd.toFixed(2)}`}
            </Text>
            <Text style={[styles.rowStatus, { color: resultColor }]}>
              {resultLabel.toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
            {title}
          </Text>
          <Text style={[styles.rowSub, { color: c.textMuted }]}>
            {formatLongDate(getBetStartDate(bet))} · tier{' '}
            {bet.minTier.toUpperCase()}
          </Text>
        </Pressable>
        <Pressable
          onPress={onDelete}
          hitSlop={10}
          style={({ pressed }) => [
            styles.deleteBtn,
            { opacity: pressed ? 0.5 : 1 },
          ]}>
          <SymbolView
            name="trash"
            size={18}
            tintColor={c.danger}
            weight="medium"
          />
        </Pressable>
      </View>

      {/* COMBO : toujours bouton "Modifier" (peu importe le state) →
          ouvre le sheet d'édition par sélection. Plus pertinent qu'un
          marquage global Gagné/Perdu/Annulé qui s'appliquerait à TOUTES
          les sélections d'un coup. */}
      {bet.type === 'combo' ? (
        <Pressable
          onPress={onModify}
          style={({ pressed }) => [
            styles.modifyBtn,
            {
              backgroundColor: c.bgDeeper,
              borderColor: c.borderSoft,
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <SymbolView
            name="square.and.pencil"
            size={14}
            tintColor={c.text}
            weight="medium"
          />
          <Text style={[styles.resultBtnText, { color: c.text }]}>
            Modifier sélections
          </Text>
        </Pressable>
      ) : bet.result === 'win' || bet.result === 'loss' || bet.result === 'void' ? (
        /* SINGLE résolu : bouton "Modifier" qui ré-ouvre l'Alert à 3 choix */
        <Pressable
          onPress={onModify}
          style={({ pressed }) => [
            styles.modifyBtn,
            {
              backgroundColor: c.bgDeeper,
              borderColor: c.borderSoft,
              opacity: pressed ? 0.6 : 1,
            },
          ]}>
          <SymbolView
            name="square.and.pencil"
            size={14}
            tintColor={c.text}
            weight="medium"
          />
          <Text style={[styles.resultBtnText, { color: c.text }]}>
            Modifier
          </Text>
        </Pressable>
      ) : (
        /* SINGLE pending : 3 boutons rapides Gagné / Perdu / Annulé */
        <View style={{ gap: 8 }}>
          <View style={styles.resultBtnRow}>
            <Pressable
              onPress={onMarkWin}
              style={({ pressed }) => [
                styles.resultBtn,
                {
                  backgroundColor: 'rgba(16,185,129,0.15)',
                  borderColor: c.success,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="checkmark"
                size={14}
                tintColor={c.success}
                weight="bold"
              />
              <Text style={[styles.resultBtnText, { color: c.success }]}>
                Gagné
              </Text>
            </Pressable>
            <Pressable
              onPress={onMarkLoss}
              style={({ pressed }) => [
                styles.resultBtn,
                {
                  backgroundColor: 'rgba(239,68,68,0.15)',
                  borderColor: c.danger,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="xmark"
                size={14}
                tintColor={c.danger}
                weight="bold"
              />
              <Text style={[styles.resultBtnText, { color: c.danger }]}>
                Perdu
              </Text>
            </Pressable>
          </View>
          {/* Bouton secondaire "Annulé" — usage rare donc UI discrète */}
          <Pressable
            onPress={onMarkVoid}
            style={({ pressed }) => [
              styles.voidBtn,
              {
                borderColor: c.borderSoft,
                opacity: pressed ? 0.6 : 1,
              },
            ]}>
            <SymbolView
              name="minus.circle"
              size={12}
              tintColor={c.textMuted}
              weight="medium"
            />
            <Text style={[styles.voidBtnText, { color: c.textMuted }]}>
              Annulé
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  stickyBarWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  container: {
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five + 60,
    gap: Spacing.four,
  },
  headerBlock: {
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  h1: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 44,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.two,
  },
  // === CTAs ===
  ctaRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  ctaCard: {
    flex: 1,
    padding: Spacing.three,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: Spacing.three,
    minHeight: 150,
    justifyContent: 'space-between',
  },
  ctaIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    gap: 2,
  },
  ctaTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  ctaSub: {
    fontSize: 12,
  },
  // === Section ===
  section: { gap: Spacing.two },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  sectionEyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '600',
  },
  // === Empty card ===
  emptyCard: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  emptyIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextWrap: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  // === Bet row (liste) ===
  row: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: Spacing.three,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resultBtnRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  resultBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  resultBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.2,
  },
  voidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  voidBtnText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  rowMain: { flex: 1, gap: 4 },
  rowHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  rowKind: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowStatus: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  rowSub: {
    fontSize: 12,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === Locked ===
  lockedBlock: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  lockedTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  lockedBody: {
    fontSize: 14,
    textAlign: 'center',
  },

  // === Stats ribbon ===
  statsRibbon: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  statMini: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  statMiniLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statMiniValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },

  // === Tabs ===
  tabsBar: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
    marginBottom: Spacing.two,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 999,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabBadge: {
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // === Search bar ===
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },

  // === Day group ===
  dayHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 8,
  },
  dayHeadLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  dayHeadMeta: {
    fontSize: 11,
  },

  // === Liste compacte ===
  rowList: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  compactRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarCombo: {},
  compactAvatarComboText: {
    fontSize: 12,
    fontWeight: '900',
  },
  compactBody: {
    flex: 1,
    minWidth: 0,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  compactSub: {
    fontSize: 11,
    marginTop: 2,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  compactOdd: {
    fontSize: 13,
    fontWeight: '800',
  },
  compactDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(250,250,247,0.25)',
  },
  compactTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  compactTierText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  compactTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactLiveBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  compactLiveText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: '#FFFFFF',
  },
  compactActions: {
    flexDirection: 'column',
    gap: 6,
  },
  compactIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
