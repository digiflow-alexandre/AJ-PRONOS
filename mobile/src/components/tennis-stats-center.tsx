import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { Prono } from '@/types/prono';
import type {
  PlayerProfile,
  TennisMatch,
  TennisStats,
  TennisSurface,
} from '@/types/tennis-stats';

const COLOR_WIN = '#10B981';
const COLOR_LOSS = '#EF4444';

type Tab = 'profil' | 'forme' | 'tableau';
type ChipKey = 'home' | 'away' | 'h2h';
type SurfaceFilter = 'all' | TennisSurface;

const SURFACE_LABEL: Record<SurfaceFilter, string> = {
  all: 'Tous',
  dur: 'Dur',
  terre: 'Terre',
  gazon: 'Gazon',
};

/**
 * Body du Stats Center tennis. Rendu à l'intérieur du Modal parent,
 * en remplacement du body foot.
 */
export function TennisStatsBody({ prono }: { prono: Prono }) {
  const c = useThemeColors();
  const stats = prono.tennisStats;
  const [tab, setTab] = useState<Tab>('profil');

  if (!stats) {
    return (
      <View style={{ padding: Spacing.four, alignItems: 'center', gap: 8 }}>
        <SymbolView name="chart.bar" size={32} tintColor={c.gold} weight="regular" />
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
          Stats tennis bientôt
        </Text>
        <Text style={{ color: c.textMuted, fontSize: 13, textAlign: 'center' }}>
          Les statistiques avancées tennis seront disponibles dès que notre
          branchement API tennis sera actif.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.tabsRow, { borderBottomColor: c.borderFaint }]}>
        <TabBtn label="Profil" active={tab === 'profil'} onPress={() => setTab('profil')} />
        <TabBtn label="Forme" active={tab === 'forme'} onPress={() => setTab('forme')} />
        <TabBtn label="Tableau" active={tab === 'tableau'} onPress={() => setTab('tableau')} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: Spacing.four, gap: Spacing.three }}
        showsVerticalScrollIndicator={false}>
        {tab === 'profil' ? (
          <ProfilPanel prono={prono} stats={stats} />
        ) : tab === 'forme' ? (
          <FormePanel prono={prono} stats={stats} />
        ) : (
          <TableauPanel />
        )}
      </ScrollView>
    </>
  );
}

function TabBtn({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.tabBtn, { opacity: pressed ? 0.7 : 1 }]}>
      <Text
        style={[styles.tabBtnText, { color: active ? c.text : c.textMuted }]}>
        {label}
      </Text>
      <View
        style={[
          styles.tabUnderline,
          { backgroundColor: active ? c.gold : 'transparent' },
        ]}
      />
    </Pressable>
  );
}

// ============= PROFIL (comparatif gauche/droite) =============
function ProfilPanel({
  prono,
  stats,
}: {
  prono: Prono;
  stats: TennisStats;
}) {
  const c = useThemeColors();
  const surfaceLabel = SURFACE_LABEL[stats.tournament.surface].toLowerCase();
  const home = stats.homeProfile;
  const away = stats.awayProfile;

  return (
    <View
      style={[
        styles.compareCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.goldDecorative,
          shadowColor: '#0A0A0A',
        },
      ]}>
      {/* Header : drapeau + nom de chaque joueur */}
      <View style={styles.compareHeader}>
        <PlayerHeader
          profile={home}
          name={prono.teamHome}
          align="left"
        />
        <Text style={[styles.compareVs, { color: c.textDim }]}>VS</Text>
        <PlayerHeader
          profile={away}
          name={prono.teamAway}
          align="right"
        />
      </View>

      {/* BIO */}
      <CompareBlock title="BIO" icon="person.fill">
        <CompareRow
          label="Âge"
          leftValue={home.age ? `${home.age} ans` : '—'}
          rightValue={away.age ? `${away.age} ans` : '—'}
        />
        <CompareRow
          label="Classement ATP"
          leftValue={home.rankingAtp ? `#${home.rankingAtp}` : '—'}
          rightValue={away.rankingAtp ? `#${away.rankingAtp}` : '—'}
          better={lowerIsBetter(home.rankingAtp, away.rankingAtp)}
        />
        <CompareRow
          label="Classement Race"
          leftValue={home.rankingRace ? `#${home.rankingRace}` : '—'}
          rightValue={away.rankingRace ? `#${away.rankingRace}` : '—'}
          better={lowerIsBetter(home.rankingRace, away.rankingRace)}
        />
        <CompareRow
          label="Main forte"
          leftValue={home.handedness ? cap(home.handedness) : '—'}
          rightValue={away.handedness ? cap(away.handedness) : '—'}
        />
        <CompareRow
          label="Taille"
          leftValue={home.heightCm ? `${(home.heightCm / 100).toFixed(2)} m` : '—'}
          rightValue={away.heightCm ? `${(away.heightCm / 100).toFixed(2)} m` : '—'}
        />
        <CompareRow
          label="Passage pro"
          leftValue={home.turnedProYear ? `${home.turnedProYear}` : '—'}
          rightValue={away.turnedProYear ? `${away.turnedProYear}` : '—'}
        />
      </CompareBlock>

      {/* SAISON */}
      <CompareBlock title="SAISON" icon="calendar">
        <CompareRow
          label="% Victoires"
          leftValue={`${home.seasonWinRate}%`}
          rightValue={`${away.seasonWinRate}%`}
          better={higherIsBetter(home.seasonWinRate, away.seasonWinRate)}
        />
        <CompareRow
          label={`% Sur ${surfaceLabel}`}
          leftValue={`${home.seasonSurfaceWinRate}%`}
          rightValue={`${away.seasonSurfaceWinRate}%`}
          better={higherIsBetter(
            home.seasonSurfaceWinRate,
            away.seasonSurfaceWinRate,
          )}
        />
        <CompareRow
          label="Titres"
          leftValue={`${home.seasonTitles}`}
          rightValue={`${away.seasonTitles}`}
          better={higherIsBetter(home.seasonTitles, away.seasonTitles)}
        />
      </CompareBlock>

      {/* CARRIÈRE */}
      <CompareBlock title="CARRIÈRE" icon="trophy.fill">
        <CompareRow
          label="% Victoires"
          leftValue={`${home.careerWinRate}%`}
          rightValue={`${away.careerWinRate}%`}
          better={higherIsBetter(home.careerWinRate, away.careerWinRate)}
        />
        <CompareRow
          label={`% Sur ${surfaceLabel}`}
          leftValue={`${home.careerSurfaceWinRate}%`}
          rightValue={`${away.careerSurfaceWinRate}%`}
          better={higherIsBetter(
            home.careerSurfaceWinRate,
            away.careerSurfaceWinRate,
          )}
        />
        <CompareRow
          label="Titres"
          leftValue={`${home.careerTitles}`}
          rightValue={`${away.careerTitles}`}
          better={higherIsBetter(home.careerTitles, away.careerTitles)}
        />
      </CompareBlock>
    </View>
  );
}

function PlayerHeader({
  profile,
  name,
  align,
}: {
  profile: PlayerProfile;
  name: string;
  align: 'left' | 'right';
}) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.playerHeader,
        align === 'right' && { flexDirection: 'row-reverse' },
      ]}>
      {profile.flag ? (
        <Image
          source={{ uri: profile.flag }}
          style={styles.playerFlag}
          contentFit="cover"
        />
      ) : null}
      <Text
        style={[
          styles.playerName,
          { color: c.text, textAlign: align },
        ]}
        numberOfLines={1}>
        {profile.fullName || name}
      </Text>
    </View>
  );
}

function CompareBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.compareBlock}>
      <View style={styles.compareBlockHeader}>
        <SymbolView name={icon as never} size={11} tintColor={c.gold} weight="semibold" />
        <Text style={[styles.compareBlockTitle, { color: c.textMuted }]}>
          {title}
        </Text>
      </View>
      <View style={{ gap: 6 }}>{children}</View>
    </View>
  );
}

function CompareRow({
  label,
  leftValue,
  rightValue,
  better,
}: {
  label: string;
  leftValue: string;
  rightValue: string;
  /** 'left' = joueur domicile meilleur. 'right' = visiteur meilleur. undefined = neutre. */
  better?: 'left' | 'right';
}) {
  const c = useThemeColors();
  return (
    <View style={styles.compareRow}>
      <Text
        style={[
          styles.compareValue,
          {
            color: c.text,
            fontWeight: better === 'left' ? '800' : '500',
            textAlign: 'left',
          },
        ]}>
        {leftValue}
      </Text>
      <Text
        style={[styles.compareLabel, { color: c.textMuted }]}
        numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[
          styles.compareValue,
          {
            color: c.text,
            fontWeight: better === 'right' ? '800' : '500',
            textAlign: 'right',
          },
        ]}>
        {rightValue}
      </Text>
    </View>
  );
}

function higherIsBetter(left: number, right: number): 'left' | 'right' | undefined {
  if (left === right) return undefined;
  return left > right ? 'left' : 'right';
}

function lowerIsBetter(
  left: number | null,
  right: number | null,
): 'left' | 'right' | undefined {
  if (left === null || right === null || left === right) return undefined;
  return left < right ? 'left' : 'right';
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ============= FORME =============
function FormePanel({
  prono,
  stats,
}: {
  prono: Prono;
  stats: TennisStats;
}) {
  const c = useThemeColors();
  const [chip, setChip] = useState<ChipKey>('home');
  const [surface, setSurface] = useState<SurfaceFilter>('all');

  const matches: TennisMatch[] = useMemo(() => {
    let list: TennisMatch[];
    if (chip === 'home') list = stats.homeMatches;
    else if (chip === 'away') list = stats.awayMatches;
    else list = stats.h2hMatches;

    if (surface !== 'all') {
      list = list.filter((m) => m.surface === surface);
    }
    // Limit à 10 derniers
    return list.slice(0, 10);
  }, [chip, surface, stats]);

  const counts = useMemo(() => {
    const v = matches.filter((m) => m.result === 'V').length;
    const d = matches.filter((m) => m.result === 'D').length;
    return { v, d, total: v + d };
  }, [matches]);

  return (
    <View style={{ gap: Spacing.four }}>
      {/* Chips joueur */}
      <View style={styles.chipsRow}>
        <Chip label={prono.teamHome} active={chip === 'home'} onPress={() => setChip('home')} />
        <Chip label={prono.teamAway} active={chip === 'away'} onPress={() => setChip('away')} />
        <Chip label="Face à face" active={chip === 'h2h'} onPress={() => setChip('h2h')} />
      </View>

      {/* Sub-chips surface (cachées si Face à face) */}
      {chip !== 'h2h' ? (
        <View style={styles.surfaceRow}>
          {(['all', 'dur', 'terre', 'gazon'] as SurfaceFilter[]).map((s) => (
            <SurfaceChip
              key={s}
              label={SURFACE_LABEL[s]}
              active={surface === s}
              onPress={() => setSurface(s)}
            />
          ))}
        </View>
      ) : null}

      {/* Résumé V/D */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: c.bgElevated,
            borderColor: c.goldDecorative,
            shadowColor: '#0A0A0A',
          },
        ]}>
        <View style={styles.summaryHeaderRow}>
          <SymbolView name="chart.bar.fill" size={14} tintColor={c.gold} weight="semibold" />
          <Text style={[styles.summaryCardTitle, { color: c.text }]}>
            {counts.total} dernier{counts.total > 1 ? 's' : ''} match{counts.total > 1 ? 's' : ''}
            {surface !== 'all' ? ` sur ${SURFACE_LABEL[surface].toLowerCase()}` : ''}
          </Text>
        </View>

        {counts.total > 0 ? (
          <View style={styles.propBar}>
            <View
              style={{
                flex: counts.v,
                backgroundColor: COLOR_WIN,
                borderTopLeftRadius: 4,
                borderBottomLeftRadius: 4,
              }}
            />
            <View
              style={{
                flex: counts.d,
                backgroundColor: COLOR_LOSS,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }}
            />
          </View>
        ) : null}

        <View style={styles.countRow}>
          <CountBigLabel value={counts.v} color={COLOR_WIN} label="Victoires" />
          <View style={[styles.countDivider, { backgroundColor: c.borderFaint }]} />
          <CountBigLabel value={counts.d} color={COLOR_LOSS} label="Défaites" />
        </View>
      </View>

      {/* Liste matchs — groupés par tournoi */}
      {matches.length === 0 ? (
        <Text style={[styles.empty, { color: c.textMuted }]}>
          Aucun match récent sur {SURFACE_LABEL[surface].toLowerCase()}.
        </Text>
      ) : (
        <View style={{ gap: Spacing.three }}>
          {groupByTournament(matches).map((group) => (
            <TournamentGroup key={group.key} group={group} />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * Groupe les matchs par tournoi en gardant l'ordre chronologique :
 * un nouveau "groupe" démarre dès qu'on change de tournoi entre 2 matchs
 * consécutifs (et pas un dédoublonnage absolu — si le joueur retourne sur
 * un tournoi 2 mois plus tard, ça crée bien 2 sections).
 */
type TournamentGroupData = {
  key: string;
  tournament: string;
  tournamentFlag?: string;
  surface: TennisSurface;
  matches: TennisMatch[];
  wins: number;
  losses: number;
};

function groupByTournament(matches: TennisMatch[]): TournamentGroupData[] {
  const groups: TournamentGroupData[] = [];
  matches.forEach((m, i) => {
    const last = groups[groups.length - 1];
    if (last && last.tournament === m.tournament) {
      last.matches.push(m);
      if (m.result === 'V') last.wins++;
      else last.losses++;
    } else {
      groups.push({
        key: `${m.tournament}-${i}`,
        tournament: m.tournament,
        tournamentFlag: m.tournamentFlag,
        surface: m.surface,
        matches: [m],
        wins: m.result === 'V' ? 1 : 0,
        losses: m.result === 'D' ? 1 : 0,
      });
    }
  });
  return groups;
}

function TournamentGroup({ group }: { group: TournamentGroupData }) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.tournamentCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.borderFaint,
        },
      ]}>
      {/* Header tournoi */}
      <View
        style={[
          styles.tournamentHeader,
          { backgroundColor: c.bgWarm, borderBottomColor: c.borderFaint },
        ]}>
        <View style={styles.tournamentHeaderLeft}>
          {group.tournamentFlag ? (
            <Image
              source={{ uri: group.tournamentFlag }}
              style={styles.tournamentFlag}
              contentFit="cover"
            />
          ) : null}
          <Text
            style={[styles.tournamentName, { color: c.text }]}
            numberOfLines={1}>
            {group.tournament}
          </Text>
          <View
            style={[
              styles.surfaceBadge,
              { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
            ]}>
            <Text style={[styles.surfaceBadgeText, { color: c.textMuted }]}>
              {SURFACE_LABEL[group.surface]}
            </Text>
          </View>
        </View>
        <View style={styles.tournamentBilan}>
          {group.wins > 0 ? (
            <Text style={[styles.bilanCount, { color: COLOR_WIN }]}>
              +{group.wins}
            </Text>
          ) : null}
          {group.losses > 0 ? (
            <Text style={[styles.bilanCount, { color: COLOR_LOSS }]}>
              -{group.losses}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Matchs du tournoi */}
      <View>
        {group.matches.map((m, i) => (
          <TennisMatchRow key={i} match={m} hideTournament />
        ))}
      </View>
    </View>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? c.text : 'transparent',
          borderColor: active ? c.text : c.borderSoft,
          opacity: pressed ? 0.7 : 1,
        },
      ]}>
      <Text
        style={[styles.chipText, { color: active ? c.ctaText : c.textMuted }]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function SurfaceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.surfaceChip,
        active && { borderBottomColor: c.gold, borderBottomWidth: 2 },
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text
        style={[
          styles.surfaceChipText,
          { color: active ? c.text : c.textMuted },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CountBigLabel({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: 'center', flex: 1, gap: 2 }}>
      <Text
        style={{
          fontSize: 40,
          fontWeight: '800',
          color,
          letterSpacing: -1,
          lineHeight: 44,
        }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: c.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
    </View>
  );
}

function TennisMatchRow({
  match,
  hideTournament,
}: {
  match: TennisMatch;
  /** Quand utilisé dans un TournamentGroup, on cache le nom du tournoi
   *  pour éviter la redondance (le header de section l'affiche déjà). */
  hideTournament?: boolean;
}) {
  const c = useThemeColors();
  const outcomeColor = match.result === 'V' ? COLOR_WIN : COLOR_LOSS;

  return (
    <View style={[styles.matchRow, { borderBottomColor: c.borderFaint }]}>
      <Text style={[styles.matchDate, { color: c.textDim }]}>{match.date}</Text>

      {!hideTournament ? (
        <View style={styles.matchTournament}>
          {match.tournamentFlag ? (
            <Image
              source={{ uri: match.tournamentFlag }}
              style={styles.miniFlag}
              contentFit="cover"
            />
          ) : null}
          <Text
            style={[styles.matchTournamentName, { color: c.textMuted }]}
            numberOfLines={1}>
            {match.tournament}
          </Text>
        </View>
      ) : null}

      <View style={styles.matchOpponent}>
        {match.opponentFlag ? (
          <Image
            source={{ uri: match.opponentFlag }}
            style={styles.miniFlag}
            contentFit="cover"
          />
        ) : null}
        <Text
          style={[styles.matchOpponentName, { color: c.text }]}
          numberOfLines={1}>
          {match.opponent}
        </Text>
      </View>

      <Text style={[styles.matchScore, { color: c.text }]}>
        {match.scoreSets}
      </Text>

      <View style={[styles.outcomeBadge, { borderColor: outcomeColor }]}>
        <Text style={[styles.outcomeBadgeText, { color: outcomeColor }]}>
          {match.result}
        </Text>
      </View>
    </View>
  );
}

// ============= TABLEAU (placeholder) =============
function TableauPanel() {
  const c = useThemeColors();
  return (
    <View style={{ alignItems: 'center', paddingVertical: Spacing.six, gap: 8 }}>
      <SymbolView name="chart.bar" size={32} tintColor={c.gold} weight="regular" />
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>
        Tableau du tournoi bientôt
      </Text>
      <Text
        style={{
          color: c.textMuted,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
          paddingHorizontal: Spacing.four,
        }}>
        Le bracket complet du tournoi (Round 1 → Finale) sera disponible
        avec notre branchement API tennis.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: 6,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  tabUnderline: {
    height: 2,
    width: '60%',
    borderRadius: 1,
  },
  // Profil comparatif (card unique avec 2 colonnes)
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  compareCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: Spacing.two,
  },
  playerHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerFlag: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    flex: 1,
  },
  compareVs: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  compareBlock: {
    gap: 8,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(10,10,10,0.06)',
  },
  compareBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
  },
  compareBlockTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  compareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  compareValue: {
    fontSize: 14,
    minWidth: 70,
  },
  compareLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Forme
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  surfaceRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingLeft: 2,
  },
  surfaceChip: {
    paddingHorizontal: 4,
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  surfaceChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  propBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  countRow: {
    flexDirection: 'row',
  },
  countDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    alignSelf: 'center',
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: Spacing.four,
  },
  // Tournament group (Forme)
  tournamentCard: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  tournamentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  tournamentHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  tournamentFlag: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  tournamentName: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  surfaceBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  surfaceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  tournamentBilan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bilanCount: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchDate: {
    fontSize: 11,
    fontWeight: '600',
    width: 44,
  },
  matchTournament: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchTournamentName: {
    fontSize: 11,
    fontWeight: '600',
    flexShrink: 1,
  },
  matchOpponent: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchOpponentName: {
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  miniFlag: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  matchScore: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.3,
    minWidth: 28,
    textAlign: 'center',
  },
  outcomeBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
