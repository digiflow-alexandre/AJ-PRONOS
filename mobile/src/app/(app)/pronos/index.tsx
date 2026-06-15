import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComboBetCard } from '@/components/combo-bet-card';
import { HomeStickyTopBar } from '@/components/home-hero';
import {
  MonthPickerSheet,
  monthKeyFromDate,
} from '@/components/month-picker-sheet';
import { PronoCard } from '@/components/prono-card';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { getMaxHistoryDays } from '@/lib/competition-meta';
import { useAllBets } from '@/lib/use-all-bets';
import { formatLongDate } from '@/lib/format-date';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { getBetActiveDates, getBetStartDate } from '@/types/prono';
import type { AnyBet, ComboBet, Prono, PronoResult, Sport } from '@/types/prono';

const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

type SportFilter = 'all' | Sport;
type StatusFilter = 'all' | 'pending' | 'live' | 'win' | 'loss';

const SPORT_TABS: { value: SportFilter; symbol: string; aria: string }[] = [
  { value: 'all', symbol: 'square.grid.2x2', aria: 'Tous les sports' },
  { value: 'foot', symbol: 'soccerball', aria: 'Football' },
  { value: 'tennis', symbol: 'tennisball', aria: 'Tennis' },
];

// Renvoie le sport "dominant" d'un pari (utile pour le filtre).
// Pour un combo, on retient TOUS les sports présents (multi-match)
function betHasSport(bet: AnyBet, sport: Sport): boolean {
  if (bet.type === 'single') return bet.sport === sport;
  return bet.selections.some((s) => s.sport === sport);
}

function betResult(bet: AnyBet): PronoResult {
  return bet.result;
}

// Dates affichées dans le sélecteur — uniquement celles qui ont au moins
// un prono publié (pour le sport actuellement sélectionné).
type DateBucket = {
  iso: string;        // ISO du jour (minuit local)
  short: string;      // "Mer 27"
  long: string;       // "mercredi 27 mai"
  isToday: boolean;
  count: number;
};

// Approximation : largeur moyenne d'un chip date (+ gap). Sert au scroll
// initial pour centrer "Aujourd'hui" quand il y a des dates passées à gauche.
const CHIP_WIDTH_PX = 96;

export default function PronosScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, isTrialActive, canAccess, isStaff } = useProfile();
  const { bets: ALL_BETS, isLoading: betsLoading } = useAllBets();
  const [sport, setSport] = useState<SportFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const dateScrollRef = useRef<ScrollView>(null);
  const didInitialScrollRef = useRef(false);

  // Gating historique par tier : Starter 7j, Pro 30j, VIP/trial illimité.
  // Staff (admin/validator) → accès illimité à tout l'historique pour
  // pouvoir vérifier la publication de leurs pronos.
  const maxHistoryDays = isStaff
    ? Infinity
    : getMaxHistoryDays(profile?.tier ?? null, isTrialActive);

  // Filtre par sport + cap historique par pack (utilisé pour les paris dispo).
  const allowedBets = useMemo(() => {
    const filtered = ALL_BETS.filter(
      (b) => sport === 'all' || betHasSport(b, sport),
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oldestAllowed =
      maxHistoryDays === Infinity
        ? -Infinity
        : today.getTime() - maxHistoryDays * 86_400_000;
    return filtered.filter((b) => {
      const d = new Date(getBetStartDate(b));
      d.setHours(0, 0, 0, 0);
      return d.getTime() >= oldestAllowed;
    });
  }, [sport, maxHistoryDays, ALL_BETS]);

  // Mois unique disponible le plus récent (utilisé par défaut)
  const availableMonthKeys = useMemo(() => {
    const set = new Set<string>();
    allowedBets.forEach((b) => {
      const d = new Date(getBetStartDate(b));
      set.add(monthKeyFromDate(d));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allowedBets]);

  // Bets du mois sélectionné, groupés par jour
  const { dateBuckets, betsByDate } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Comparaison par chaîne YYYY-MM-DD en LOCAL pour éviter les pièges
    // de timezone (un bucket stocké en ISO UTC peut donner un timestamp
    // différent de today.getTime() même si c'est "le même jour local").
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayKey = dayKey(today);

    // Si pas de mois sélectionné, on prend le plus récent disponible
    const targetMonth = selectedMonthKey ?? availableMonthKeys[0];
    if (!targetMonth) {
      return { dateBuckets: [] as DateBucket[], betsByDate: new Map<string, AnyBet[]>() };
    }

    // Garde-fou : un pari (single OU combo) peut "appartenir" au mois si
    // au moins une de ses dates actives tombe dedans. Pour un combo étalé
    // sur 2 mois (rare), on l'inclut dans les 2.
    const monthBets = allowedBets.filter((b) =>
      getBetActiveDates(b).some(
        (day) => monthKeyFromDate(new Date(day)) === targetMonth,
      ),
    );

    // Bucketing par jour : un combo apparaît dans CHAQUE jour où il a
    // un match (option A — Alex 2026-06-05). Pour un single = 1 bucket.
    const byDate = new Map<string, AnyBet[]>();
    monthBets.forEach((b) => {
      for (const day of getBetActiveDates(b)) {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        if (monthKeyFromDate(d) !== targetMonth) continue;
        const key = d.toISOString();
        if (!byDate.has(key)) byDate.set(key, []);
        // Dédup au cas où (un combo avec 2 matchs le même jour =
        // 1 seule date dans getBetActiveDates donc safe par construction).
        const list = byDate.get(key)!;
        if (!list.some((x) => x.id === b.id)) list.push(b);
      }
    });

    byDate.forEach((list) =>
      list.sort(
        (a, b) =>
          new Date(getBetStartDate(a)).getTime() -
          new Date(getBetStartDate(b)).getTime(),
      ),
    );

    const buckets: DateBucket[] = Array.from(byDate.keys())
      .sort()
      .map((iso) => {
        const d = new Date(iso);
        return {
          iso,
          short: shortDateLabel(d),
          long: formatLongDate(d.toISOString()),
          isToday: dayKey(d) === todayKey,
          count: byDate.get(iso)!.length,
        };
      });

    return { dateBuckets: buckets, betsByDate: byDate };
  }, [allowedBets, selectedMonthKey, availableMonthKeys]);

  // Mois courant pour le label du picker
  const currentMonthLabel = useMemo(() => {
    const key = selectedMonthKey ?? availableMonthKeys[0];
    if (!key) return 'Mois';
    const [year, month] = key.split('-').map(Number);
    return `${MONTHS_FR_SHORT[month]} ${year}`;
  }, [selectedMonthKey, availableMonthKeys]);

  // Sélection automatique : aujourd'hui par défaut, sinon le 1er bucket dispo.
  // Pattern "valeur dérivée d'une prop/state" → setState légitime ici.
  useEffect(() => {
    if (dateBuckets.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedDate(null);
      return;
    }
    if (!selectedDate || !dateBuckets.some((b) => b.iso === selectedDate)) {
      const today = dateBuckets.find((b) => b.isToday);
      setSelectedDate((today ?? dateBuckets[0]).iso);
    }
  }, [dateBuckets, selectedDate]);

  // Scroll initial du sélecteur date sur "Aujourd'hui" (pour que les jours
  // passés à sa gauche soient pas le premier élément visible).
  useEffect(() => {
    if (didInitialScrollRef.current || dateBuckets.length === 0) return;
    const idx = dateBuckets.findIndex((b) => b.isToday);
    if (idx > 0 && dateScrollRef.current) {
      // Petit délai pour laisser le layout se faire avant scroll.
      const t = setTimeout(() => {
        dateScrollRef.current?.scrollTo({
          x: idx * CHIP_WIDTH_PX - 40,
          animated: false,
        });
      }, 50);
      didInitialScrollRef.current = true;
      return () => clearTimeout(t);
    }
    if (idx <= 0) didInitialScrollRef.current = true;
  }, [dateBuckets]);

  function hasAccess(bet: AnyBet): boolean {
    return canAccess(bet.minTier);
  }

  function openBetDetail(bet: AnyBet) {
    router.push({
      pathname: '/(app)/pronos/[id]',
      params: { id: bet.id },
    });
  }

  // Counts par sport (utilisés dans les tabs)
  const countsBySport = useMemo(() => {
    const all = ALL_BETS.length;
    const foot = ALL_BETS.filter((b) => betHasSport(b, 'foot')).length;
    const tennis = ALL_BETS.filter((b) => betHasSport(b, 'tennis')).length;
    return { all, foot, tennis };
  }, [ALL_BETS]);

  const selectedBucket = dateBuckets.find((b) => b.iso === selectedDate);
  const allBetsOfDay = useMemo(
    () => (selectedDate ? (betsByDate.get(selectedDate) ?? []) : []),
    [selectedDate, betsByDate],
  );

  // Filtres status conditionnels : disponibles seulement quand le jour
  // sélectionné contient des paris résolus (sinon "tous" implicite).
  const showStatusFilters = useMemo(() => {
    return allBetsOfDay.some(
      (b) => b.result === 'win' || b.result === 'loss' || b.result === 'live',
    );
  }, [allBetsOfDay]);

  // Application du filtre status
  const betsOfDay = useMemo(() => {
    if (status === 'all') return allBetsOfDay;
    return allBetsOfDay.filter((b) => {
      const r = betResult(b);
      if (status === 'pending') return r === 'pending';
      if (status === 'live') return r === 'live';
      if (status === 'win') return r === 'win';
      if (status === 'loss') return r === 'loss';
      return true;
    });
  }, [status, allBetsOfDay]);

  // Compteurs status pour les chips (calcul sur tous les paris du jour)
  const statusCounts = useMemo(() => {
    const acc = { pending: 0, live: 0, win: 0, loss: 0 };
    allBetsOfDay.forEach((b) => {
      const r = betResult(b);
      if (r in acc) acc[r as keyof typeof acc]++;
    });
    return acc;
  }, [allBetsOfDay]);

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Background : même image que Stats/Carnet (rayures dorées) */}
      <ExpoImage
        source={require('@/assets/images/bg-stats.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.bgOverlay} pointerEvents="none" />

      {/* Spacer pour décaler sous la sticky bar */}
      <View style={{ height: insets.top + 60 }} />

      {/* Cards sport sélecteur (Total / Football / Tennis) */}
      <View style={styles.sportBar}>
        {SPORT_TABS.map((t) => {
          const count =
            t.value === 'all'
              ? countsBySport.all
              : t.value === 'foot'
                ? countsBySport.foot
                : countsBySport.tennis;
          const label =
            t.value === 'all'
              ? 'TOTAL'
              : t.value === 'foot'
                ? 'FOOTBALL'
                : 'TENNIS';
          return (
            <SportTab
              key={t.value}
              symbol={t.symbol}
              label={label}
              aria={t.aria}
              count={count}
              active={sport === t.value}
              onPress={() => setSport(t.value)}
            />
          );
        })}
      </View>

      {/* Picker de mois + sélecteur date horizontal */}
      {availableMonthKeys.length > 0 ? (
        <>
          <View
            style={[
              styles.monthPickerBar,
              { backgroundColor: c.bg, borderBottomColor: c.borderFaint },
            ]}>
            <Pressable
              onPress={() => setMonthPickerOpen(true)}
              style={({ pressed }) => [
                styles.monthPickerBtn,
                {
                  backgroundColor: c.bgDeeper,
                  borderColor: c.borderSoft,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <SymbolView
                name="calendar"
                size={14}
                tintColor={c.gold}
                weight="semibold"
              />
              <Text style={[styles.monthPickerLabel, { color: c.text }]}>
                {currentMonthLabel}
              </Text>
              <SymbolView
                name="chevron.down"
                size={11}
                tintColor={c.textMuted}
                weight="bold"
              />
            </Pressable>
            <Text style={[styles.monthPickerTotal, { color: c.textDim }]}>
              {dateBuckets.reduce((acc, b) => acc + b.count, 0)} paris
            </Text>
          </View>

          {dateBuckets.length > 0 ? (
            <View style={[styles.dateBar, { borderBottomColor: c.borderFaint }]}>
              <ScrollView
                ref={dateScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateBarContent}>
                {dateBuckets.map((b) => (
                  <DateChip
                    key={b.iso}
                    bucket={b}
                    active={b.iso === selectedDate}
                    onPress={() => setSelectedDate(b.iso)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Filtres status (seulement si jour contient des paris résolus/live) */}
      {showStatusFilters ? (
        <View
          style={[
            styles.statusBar,
            { backgroundColor: c.bg, borderBottomColor: c.borderFaint },
          ]}>
          <StatusChip
            label="Tous"
            count={allBetsOfDay.length}
            active={status === 'all'}
            onPress={() => setStatus('all')}
          />
          {statusCounts.live > 0 ? (
            <StatusChip
              label="Live"
              count={statusCounts.live}
              active={status === 'live'}
              onPress={() => setStatus('live')}
              color="#F59E0B"
            />
          ) : null}
          {statusCounts.win > 0 ? (
            <StatusChip
              label="Gagnés"
              count={statusCounts.win}
              active={status === 'win'}
              onPress={() => setStatus('win')}
              color="#10B981"
            />
          ) : null}
          {statusCounts.loss > 0 ? (
            <StatusChip
              label="Perdus"
              count={statusCounts.loss}
              active={status === 'loss'}
              onPress={() => setStatus('loss')}
              color="#EF4444"
            />
          ) : null}
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {selectedBucket ? (
          <View style={styles.sectionHead}>
            <Text style={[styles.sectionEyebrow, { color: c.gold }]}>
              {selectedBucket.isToday
                ? `AUJOURD’HUI · ${selectedBucket.long}`
                : selectedBucket.long.toUpperCase()}
            </Text>
            <Text style={[styles.sectionCount, { color: c.textDim }]}>
              {betsOfDay.length}{' '}
              {betsOfDay.length > 1 ? 'pronos' : 'prono'}
            </Text>
          </View>
        ) : null}

        {betsOfDay.length === 0 ? (
          betsLoading ? <LoadingState /> : <EmptyState />
        ) : (
          <View style={styles.cards}>
            {betsOfDay.map((b) =>
              b.type === 'single' ? (
                <PronoCard
                  key={b.id}
                  prono={b as Prono}
                  hasAccess={hasAccess(b)}
                  onPress={() => openBetDetail(b)}
                />
              ) : (
                <ComboBetCard
                  key={b.id}
                  combo={b as ComboBet}
                  hasAccess={hasAccess(b)}
                  onPress={() => openBetDetail(b)}
                />
              ),
            )}
          </View>
        )}
      </ScrollView>

      {/* Picker de mois (bottom sheet) */}
      <MonthPickerSheet
        visible={monthPickerOpen}
        bets={allowedBets}
        selectedMonthKey={selectedMonthKey ?? availableMonthKeys[0] ?? null}
        onSelect={(key) => {
          setSelectedMonthKey(key);
          setSelectedDate(null); // reset, will pick first day of new month
          didInitialScrollRef.current = false;
        }}
        onClose={() => setMonthPickerOpen(false)}
      />

      {/* Sticky top bar (logo + cloche + profil) toujours visible */}
      <View style={styles.stickyBarWrap} pointerEvents="box-none">
        <HomeStickyTopBar />
      </View>
    </View>
  );
}

function StatusChip({
  label,
  count,
  active,
  onPress,
  color,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  color?: string;
}) {
  const c = useThemeColors();
  // Pill border doré par défaut. Si color (Live/Gagnés/Perdus), border colorée.
  const borderActive = color ?? c.gold;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statusChip,
        {
          borderColor: active ? borderActive : c.borderSoft,
          backgroundColor: active ? 'rgba(232,201,90,0.10)' : 'transparent',
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[
          styles.statusChipText,
          { color: active ? (color ?? c.text) : c.textMuted },
        ]}>
        {label}
      </Text>
      <Text
        style={[
          styles.statusChipCount,
          { color: active ? (color ?? c.gold) : c.textMuted },
        ]}>
        {count}
      </Text>
    </Pressable>
  );
}

function SportTab({
  symbol,
  label,
  aria,
  count,
  active,
  onPress,
}: {
  symbol: string;
  label: string;
  aria: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${aria} (${count} pronos)`}
      style={({ pressed }) => [
        styles.sportCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: active ? c.gold : c.borderSoft,
          opacity: pressed ? 0.7 : 1,
        },
        active && {
          shadowColor: c.gold,
          shadowOpacity: 0.3,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 4,
        },
      ]}>
      <View style={styles.sportCardLeft}>
        {symbol === 'tennisball' ? (
          <SymbolView
            name={symbol as never}
            size={18}
            tintColor="#D4FF00"
            weight="bold"
          />
        ) : symbol === 'soccerball' ? (
          <SymbolView
            name={symbol as never}
            size={18}
            type="multicolor"
            tintColor="#1E88E5"
            weight="bold"
          />
        ) : (
          <SymbolView
            name={symbol as never}
            size={16}
            tintColor={c.gold}
            weight="bold"
          />
        )}
      </View>
      <View style={styles.sportCardRight}>
        <Text
          style={[styles.sportCardCount, { color: c.text }]}
          numberOfLines={1}>
          {count}
        </Text>
        <Text
          style={[styles.sportCardLabel, { color: c.textMuted }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function DateChip({
  bucket,
  active,
  onPress,
}: {
  bucket: DateBucket;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.dateChip,
        active && {
          borderBottomColor: c.gold,
          borderBottomWidth: 2,
        },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text
        style={[
          styles.dateChipText,
          { color: active ? c.text : c.textMuted },
        ]}>
        {bucket.isToday ? "Aujourd'hui" : bucket.short}
      </Text>
      <View
        style={[
          styles.dateChipCountWrap,
          { backgroundColor: active ? c.text : c.bgDeeper },
        ]}>
        <Text
          style={[
            styles.dateChipCount,
            { color: active ? c.ctaText : c.textMuted },
          ]}>
          {bucket.count}
        </Text>
      </View>
    </Pressable>
  );
}

function EmptyState() {
  const c = useThemeColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyEyebrow, { color: c.gold }]}>
        — RIEN POUR L’INSTANT
      </Text>
      <Text style={[styles.emptyTitle, { color: c.text }]}>
        Pas encore de prono ici.
      </Text>
      <Text style={[styles.emptyBody, { color: c.textMuted }]}>
        Aucun pronostic publié pour ce jour et ce sport. Active les
        notifications pour être prévenu dès qu’un prono arrive.
      </Text>
    </View>
  );
}

function LoadingState() {
  const c = useThemeColors();
  return (
    <View style={[styles.empty, { alignItems: 'center' }]}>
      <ActivityIndicator size="large" color={c.gold} />
      <Text style={[styles.emptyBody, { color: c.textMuted, marginTop: 8 }]}>
        Chargement des pronos…
      </Text>
    </View>
  );
}

const DAY_LETTERS_FR = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

function shortDateLabel(d: Date): string {
  const day = DAY_LETTERS_FR[d.getDay()];
  return `${day} ${d.getDate()}`;
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
  sportBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: 10,
  },
  sportCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  sportCardLeft: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(232,201,90,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportCardRight: {
    flex: 1,
    gap: 1,
  },
  sportCardCount: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  sportCardLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  monthPickerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  monthPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  monthPickerLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
    textTransform: 'capitalize',
  },
  monthPickerTotal: {
    fontSize: 11,
    fontWeight: '600',
  },
  dateBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dateBarContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  statusBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipCount: {
    fontSize: 12,
    fontWeight: '800',
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  dateChipText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  dateChipCountWrap: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  scroll: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five + 60,
    gap: Spacing.three,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    flexShrink: 1,
  },
  sectionCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  cards: {
    gap: Spacing.three,
  },
  empty: {
    padding: Spacing.four,
    gap: Spacing.two,
    alignItems: 'flex-start',
    marginTop: Spacing.four,
  },
  emptyEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
