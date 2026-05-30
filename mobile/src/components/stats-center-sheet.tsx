import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { Prono } from '@/types/prono';
import type { MatchOutcome, RecentMatch, StandingRow } from '@/types/stats';

import { TennisStatsBody } from './tennis-stats-center';

const OUTCOME_COLORS: Record<MatchOutcome, string> = {
  V: '#10B981',
  N: '#9CA3AF',
  D: '#EF4444',
};

// Couleurs comparatives saison (home / away)
const HOME_COLOR = '#091C3E'; // bleu nuit
const AWAY_COLOR = '#B8941F'; // or

type Tab = 'forme' | 'saison' | 'classement';
type ChipKey = 'home' | 'away' | 'h2h';

export function StatsCenterSheet({
  visible,
  prono,
  onClose,
}: {
  visible: boolean;
  prono: Prono | null;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('forme');
  const [chip, setChip] = useState<ChipKey>('home');

  if (!prono) return null;
  const stats = prono.stats;
  const isTennis = prono.sport === 'tennis';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: c.bg }]}>
        {/* Header (commun foot + tennis) */}
        <View
          style={[
            styles.headerWrap,
            {
              paddingTop: insets.top + 6,
              borderBottomColor: c.borderFaint,
              backgroundColor: c.bgDeeper,
            },
          ]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerSpacer} />
            <Text style={[styles.headerTitle, { color: c.text }]}>
              STATS CENTER
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                {
                  backgroundColor: c.bgElevated,
                  borderColor: c.borderSoft,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}>
              <SymbolView
                name="xmark"
                size={14}
                tintColor={c.text}
                weight="bold"
              />
            </Pressable>
          </View>

          {/* Teams summary (commun) */}
          <TeamsSummary prono={prono} />

          {/* Tabs : tennis vs foot — tennis a ses propres onglets dans TennisStatsBody */}
          {!isTennis ? (
            <View style={styles.tabsRow}>
              <TabBtn
                label="Forme"
                active={tab === 'forme'}
                onPress={() => setTab('forme')}
              />
              <TabBtn
                label="Saison"
                active={tab === 'saison'}
                onPress={() => setTab('saison')}
              />
              <TabBtn
                label="Classement"
                active={tab === 'classement'}
                onPress={() => setTab('classement')}
              />
            </View>
          ) : null}
        </View>

        {/* Body : tennis = TennisStatsBody, foot = panels existants */}
        {isTennis ? (
          <TennisStatsBody prono={prono} />
        ) : (
          <ScrollView
            style={{ flex: 1, backgroundColor: c.bg }}
            contentContainerStyle={{
              padding: Spacing.four,
              paddingBottom: insets.bottom + Spacing.five,
            }}
            showsVerticalScrollIndicator={false}>
            {!stats ? (
              <NoStatsState />
            ) : tab === 'forme' ? (
              <FormePanel
                prono={prono}
                stats={stats}
                chip={chip}
                setChip={setChip}
              />
            ) : tab === 'saison' ? (
              <SaisonPanel prono={prono} stats={stats} />
            ) : (
              <ClassementPanel prono={prono} stats={stats} />
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function TeamsSummary({ prono }: { prono: Prono }) {
  const c = useThemeColors();
  const stats = prono.stats;
  const homeForm = prono.teamHomeForm ?? [];
  const awayForm = prono.teamAwayForm ?? [];

  return (
    <View style={styles.teamsSummary}>
      <View style={styles.teamSummary}>
        <View style={[styles.summaryLogoWrap, { backgroundColor: c.bgElevated }]}>
          {prono.teamHomeLogo ? (
            <Image
              source={{ uri: prono.teamHomeLogo }}
              style={styles.summaryLogo}
              contentFit="contain"
            />
          ) : null}
        </View>
        <Text
          style={[styles.summaryTeamName, { color: c.text }]}
          numberOfLines={1}>
          {prono.teamHome}
        </Text>
        <View style={styles.summaryFormRow}>
          <FormPillsMini form={homeForm} />
          {stats ? (
            <View style={[styles.posBadge, { borderColor: c.borderSoft }]}>
              <Text style={[styles.posBadgeText, { color: c.text }]}>
                #{stats.homePosition}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.middleCol}>
        <Text style={[styles.heroDate, { color: c.textMuted }]}>
          {new Date(prono.matchStartAt)
            .toLocaleDateString('fr-FR', { weekday: 'short' })
            .replace('.', '')}
        </Text>
        <Text style={[styles.heroHour, { color: c.text }]}>
          {new Date(prono.matchStartAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.teamSummary}>
        <View style={[styles.summaryLogoWrap, { backgroundColor: c.bgElevated }]}>
          {prono.teamAwayLogo ? (
            <Image
              source={{ uri: prono.teamAwayLogo }}
              style={styles.summaryLogo}
              contentFit="contain"
            />
          ) : null}
        </View>
        <Text
          style={[styles.summaryTeamName, { color: c.text }]}
          numberOfLines={1}>
          {prono.teamAway}
        </Text>
        <View style={styles.summaryFormRow}>
          {stats ? (
            <View style={[styles.posBadge, { borderColor: c.borderSoft }]}>
              <Text style={[styles.posBadgeText, { color: c.text }]}>
                #{stats.awayPosition}
              </Text>
            </View>
          ) : null}
          <FormPillsMini form={awayForm} />
        </View>
      </View>
    </View>
  );
}

function FormPillsMini({ form }: { form: ('W' | 'D' | 'L')[] }) {
  const map = { W: 'V' as const, D: 'N' as const, L: 'D' as const };
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {form.map((slot, i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: OUTCOME_COLORS[map[slot]],
          }}
        />
      ))}
    </View>
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
      style={({ pressed }) => [
        styles.tabBtn,
        { opacity: pressed ? 0.7 : 1 },
      ]}>
      <Text
        style={[
          styles.tabBtnText,
          { color: active ? c.text : c.textMuted },
        ]}>
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

// ============= FORME =============
function FormePanel({
  prono,
  stats,
  chip,
  setChip,
}: {
  prono: Prono;
  stats: NonNullable<Prono['stats']>;
  chip: ChipKey;
  setChip: (k: ChipKey) => void;
}) {
  const c = useThemeColors();
  const matches: RecentMatch[] = useMemo(() => {
    if (chip === 'home') return stats.homeRecentMatches;
    if (chip === 'away') return stats.awayRecentMatches;
    return stats.h2hMatches;
  }, [chip, stats]);

  const counts = useMemo(() => {
    const v = matches.filter((m) => m.result === 'V').length;
    const n = matches.filter((m) => m.result === 'N').length;
    const d = matches.filter((m) => m.result === 'D').length;
    return { v, n, d, total: v + n + d };
  }, [matches]);

  return (
    <View style={{ gap: Spacing.four }}>
      {/* Chips */}
      <View style={styles.chipsRow}>
        <Chip
          label={prono.teamHome}
          active={chip === 'home'}
          onPress={() => setChip('home')}
        />
        <Chip
          label={prono.teamAway}
          active={chip === 'away'}
          onPress={() => setChip('away')}
        />
        <Chip
          label="Face à face"
          active={chip === 'h2h'}
          onPress={() => setChip('h2h')}
        />
      </View>

      {/* Résumé V/N/D — card premium */}
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
          <SymbolView
            name="chart.bar.fill"
            size={14}
            tintColor={c.gold}
            weight="semibold"
          />
          <Text style={[styles.summaryCardTitle, { color: c.text }]}>
            {matches.length} derniers matchs
          </Text>
        </View>

        <ProportionBar counts={counts} />

        <View style={styles.summaryCounts}>
          <CountBigLabel value={counts.v} color={OUTCOME_COLORS.V} label="Victoires" />
          <View style={[styles.countDivider, { backgroundColor: c.borderFaint }]} />
          <CountBigLabel value={counts.n} color={OUTCOME_COLORS.N} label="Nuls" />
          <View style={[styles.countDivider, { backgroundColor: c.borderFaint }]} />
          <CountBigLabel value={counts.d} color={OUTCOME_COLORS.D} label="Défaites" />
        </View>
      </View>

      {/* Liste matchs */}
      <View style={styles.matchList}>
        {matches.map((m, i) => (
          <MatchRow
            key={i}
            match={m}
            selfTeam={
              chip === 'home'
                ? prono.teamHome
                : chip === 'away'
                  ? prono.teamAway
                  : prono.teamHome // POV équipe domicile pour H2H
            }
            selfTeamLogo={
              chip === 'home'
                ? prono.teamHomeLogo
                : chip === 'away'
                  ? prono.teamAwayLogo
                  : prono.teamHomeLogo
            }
          />
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
        style={[
          styles.chipText,
          { color: active ? c.ctaText : c.textMuted },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProportionBar({
  counts,
}: {
  counts: { v: number; n: number; d: number; total: number };
}) {
  if (counts.total === 0) return null;
  return (
    <View style={styles.proportionBar}>
      <View
        style={{
          flex: counts.v,
          backgroundColor: OUTCOME_COLORS.V,
          borderTopLeftRadius: 4,
          borderBottomLeftRadius: 4,
        }}
      />
      <View style={{ flex: counts.n, backgroundColor: OUTCOME_COLORS.N }} />
      <View
        style={{
          flex: counts.d,
          backgroundColor: OUTCOME_COLORS.D,
          borderTopRightRadius: 4,
          borderBottomRightRadius: 4,
        }}
      />
    </View>
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

function MatchRow({
  match,
  selfTeam,
  selfTeamLogo,
}: {
  match: RecentMatch;
  selfTeam: string;
  selfTeamLogo?: string;
}) {
  const c = useThemeColors();
  const outcomeColor = OUTCOME_COLORS[match.result];

  // Détermine qui est domicile / extérieur dans CE match + leurs logos
  const homeTeamName = match.isHome ? selfTeam : match.opponent;
  const awayTeamName = match.isHome ? match.opponent : selfTeam;
  const homeLogo = match.isHome ? selfTeamLogo : match.opponentLogo;
  const awayLogo = match.isHome ? match.opponentLogo : selfTeamLogo;

  return (
    <View style={[styles.matchRow, { borderBottomColor: c.borderFaint }]}>
      <Text style={[styles.matchDate, { color: c.textDim }]}>{match.date}</Text>

      <View style={styles.matchTeams}>
        <TeamLine
          name={homeTeamName}
          logo={homeLogo}
          highlighted={homeTeamName === selfTeam}
        />
        <TeamLine
          name={awayTeamName}
          logo={awayLogo}
          highlighted={awayTeamName === selfTeam}
        />
      </View>

      <View style={styles.matchScore}>
        <Text style={[styles.matchScoreText, { color: c.text }]}>
          {match.scoreHome}
        </Text>
        <Text style={[styles.matchScoreText, { color: c.text }]}>
          {match.scoreAway}
        </Text>
      </View>

      <View style={[styles.outcomeBadge, { borderColor: outcomeColor }]}>
        <Text style={[styles.outcomeBadgeText, { color: outcomeColor }]}>
          {match.result}
        </Text>
      </View>
    </View>
  );
}

function TeamLine({
  name,
  logo,
  highlighted,
}: {
  name: string;
  logo?: string;
  highlighted: boolean;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.teamLine}>
      {logo ? (
        <Image
          source={{ uri: logo }}
          style={styles.teamLogoMini}
          contentFit="contain"
        />
      ) : (
        <View style={styles.teamLogoMiniPlaceholder} />
      )}
      <Text
        style={[
          styles.matchTeamName,
          {
            color: c.text,
            fontWeight: highlighted ? '800' : '600',
          },
        ]}
        numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

// ============= SAISON =============
function SaisonPanel({
  prono,
  stats,
}: {
  prono: Prono;
  stats: NonNullable<Prono['stats']>;
}) {
  const c = useThemeColors();
  const rows: {
    label: string;
    home: number;
    away: number;
    suffix?: string;
  }[] = [
    { label: 'Buts / match', home: stats.homeSeasonStats.goalsForPerMatch, away: stats.awaySeasonStats.goalsForPerMatch },
    { label: 'Buts encaissés / match', home: stats.homeSeasonStats.goalsAgainstPerMatch, away: stats.awaySeasonStats.goalsAgainstPerMatch },
    { label: 'Possession moyenne', home: stats.homeSeasonStats.possessionPct, away: stats.awaySeasonStats.possessionPct, suffix: '%' },
    { label: 'Tirs / match', home: stats.homeSeasonStats.shotsPerMatch, away: stats.awaySeasonStats.shotsPerMatch },
    { label: 'Tirs cadrés / match', home: stats.homeSeasonStats.shotsOnTargetPerMatch, away: stats.awaySeasonStats.shotsOnTargetPerMatch },
    { label: 'Corners / match', home: stats.homeSeasonStats.cornersPerMatch, away: stats.awaySeasonStats.cornersPerMatch },
    { label: 'Coups francs / match', home: stats.homeSeasonStats.freeKicksPerMatch, away: stats.awaySeasonStats.freeKicksPerMatch },
    { label: 'Occasions / match', home: stats.homeSeasonStats.chancesPerMatch, away: stats.awaySeasonStats.chancesPerMatch },
    { label: 'Clean Sheets', home: stats.homeSeasonStats.cleanSheets, away: stats.awaySeasonStats.cleanSheets },
    { label: 'Cartons jaunes', home: stats.homeSeasonStats.yellowCards, away: stats.awaySeasonStats.yellowCards },
    { label: 'Cartons rouges', home: stats.homeSeasonStats.redCards, away: stats.awaySeasonStats.redCards },
  ];

  return (
    <View style={{ gap: Spacing.three }}>
      <Text style={[styles.sectionLabel, { color: c.text }]}>
        Statistiques en {stats.homeSeasonStats.competition}
      </Text>
      <View
        style={[
          styles.saisonCard,
          {
            backgroundColor: c.bgElevated,
            borderColor: c.goldDecorative,
            shadowColor: '#0A0A0A',
          },
        ]}>
        {/* Header card avec icône */}
        <View style={styles.saisonHeaderRow}>
          <SymbolView
            name="chart.line.uptrend.xyaxis"
            size={14}
            tintColor={c.gold}
            weight="semibold"
          />
          <Text style={[styles.saisonHeaderTitle, { color: c.text }]}>
            COMPARATIF
          </Text>
        </View>

        {/* Légende couleurs */}
        <View style={styles.saisonLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: HOME_COLOR }]} />
            <Text
              style={[styles.legendText, { color: c.textMuted }]}
              numberOfLines={1}>
              {prono.teamHome}
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: AWAY_COLOR }]} />
            <Text
              style={[styles.legendText, { color: c.textMuted }]}
              numberOfLines={1}>
              {prono.teamAway}
            </Text>
          </View>
        </View>

        <View style={{ gap: Spacing.three }}>
          {rows.map((r, i) => (
            <ComparisonRow key={i} {...r} />
          ))}
        </View>
      </View>
    </View>
  );
}

function ComparisonRow({
  label,
  home,
  away,
  suffix,
}: {
  label: string;
  home: number;
  away: number;
  suffix?: string;
}) {
  const c = useThemeColors();
  const max = Math.max(home, away, 0.0001);
  const homeRatio = home / max;
  const awayRatio = away / max;
  const display = (v: number) => (suffix ? `${v}${suffix}` : `${v}`);
  return (
    <View style={styles.comparisonRow}>
      <View style={styles.comparisonHeader}>
        <Text style={[styles.comparisonValue, { color: c.text }]}>{display(home)}</Text>
        <Text style={[styles.comparisonLabel, { color: c.textMuted }]}>
          {label}
        </Text>
        <Text style={[styles.comparisonValue, { color: c.text }]}>{display(away)}</Text>
      </View>
      <View style={styles.comparisonBars}>
        <View style={styles.comparisonBarHalf}>
          <View
            style={[
              styles.comparisonBarFill,
              {
                backgroundColor: HOME_COLOR,
                width: `${homeRatio * 100}%`,
                alignSelf: 'flex-end',
              },
            ]}
          />
        </View>
        <View style={styles.comparisonBarHalf}>
          <View
            style={[
              styles.comparisonBarFill,
              {
                backgroundColor: AWAY_COLOR,
                width: `${awayRatio * 100}%`,
                alignSelf: 'flex-start',
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

// ============= CLASSEMENT =============
function ClassementPanel({
  prono,
  stats,
}: {
  prono: Prono;
  stats: NonNullable<Prono['stats']>;
}) {
  const c = useThemeColors();
  const isHighlighted = (s: StandingRow) =>
    s.team === prono.teamHome || s.team === prono.teamAway;

  return (
    <View style={{ gap: Spacing.three }}>
      <Text style={[styles.sectionLabel, { color: c.text }]}>
        {stats.standingsLabel}
      </Text>

      <View
        style={[
          styles.standingsCard,
          {
            backgroundColor: c.bgElevated,
            borderColor: c.goldDecorative,
            shadowColor: '#0A0A0A',
          },
        ]}>
        {/* Header card avec icône */}
        <View
          style={[
            styles.standingsTitleRow,
            { borderBottomColor: c.borderFaint, backgroundColor: c.bgWarm },
          ]}>
          <SymbolView
            name="list.number"
            size={14}
            tintColor={c.gold}
            weight="semibold"
          />
          <Text style={[styles.standingsTitleText, { color: c.text }]}>
            CLASSEMENT
          </Text>
        </View>
        {/* Header row */}
        <View
          style={[
            styles.standingsHeader,
            { borderBottomColor: c.borderFaint },
          ]}>
          <Text
            style={[styles.standingsHeaderCell, styles.colPos, { color: c.textDim }]}>
            #
          </Text>
          <Text
            style={[
              styles.standingsHeaderCell,
              styles.colTeam,
              { color: c.textDim },
            ]}>
            Équipe
          </Text>
          <Text
            style={[styles.standingsHeaderCell, styles.colSmall, { color: c.textDim }]}>
            J
          </Text>
          <Text
            style={[styles.standingsHeaderCell, styles.colSmall, { color: c.textDim }]}>
            Diff
          </Text>
          <Text
            style={[styles.standingsHeaderCell, styles.colSmall, { color: c.textDim }]}>
            Pts
          </Text>
        </View>

        {stats.standings.map((row) => {
          const highlight = isHighlighted(row);
          return (
            <View
              key={row.position}
              style={[
                styles.standingsRow,
                {
                  borderBottomColor: c.borderFaint,
                  backgroundColor: highlight ? c.bgWarm : 'transparent',
                },
              ]}>
              <Text
                style={[
                  styles.standingsCell,
                  styles.colPos,
                  { color: highlight ? c.text : c.textMuted },
                ]}>
                {row.position}
              </Text>
              <View style={[styles.colTeam, styles.standingsTeamCell]}>
                {row.teamLogo ? (
                  <Image
                    source={{ uri: row.teamLogo }}
                    style={styles.standingsTeamLogo}
                    contentFit="contain"
                  />
                ) : (
                  <View style={styles.standingsTeamLogoPlaceholder} />
                )}
                <Text
                  style={[
                    styles.standingsCell,
                    {
                      color: c.text,
                      fontWeight: highlight ? '800' : '500',
                      flexShrink: 1,
                    },
                  ]}
                  numberOfLines={1}>
                  {row.team}
                </Text>
              </View>
              <Text
                style={[
                  styles.standingsCell,
                  styles.colSmall,
                  { color: c.textMuted },
                ]}>
                {row.played}
              </Text>
              <Text
                style={[
                  styles.standingsCell,
                  styles.colSmall,
                  { color: c.textMuted },
                ]}>
                {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
              </Text>
              <Text
                style={[
                  styles.standingsCell,
                  styles.colSmall,
                  {
                    color: c.text,
                    fontWeight: highlight ? '800' : '700',
                  },
                ]}>
                {row.points}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function NoStatsState() {
  const c = useThemeColors();
  return (
    <View style={styles.noStats}>
      <SymbolView name="chart.bar" size={32} tintColor={c.gold} weight="regular" />
      <Text style={[styles.noStatsTitle, { color: c.text }]}>
        Stats détaillées bientôt
      </Text>
      <Text style={[styles.noStatsBody, { color: c.textMuted }]}>
        Les statistiques avancées de ce match seront disponibles dès que
        notre branchement API-Football sera actif.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  // === Header ===
  headerWrap: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Teams summary
  teamsSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  teamSummary: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  summaryLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  summaryLogo: {
    width: 32,
    height: 32,
  },
  summaryTeamName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  summaryFormRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  posBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  posBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  middleCol: {
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  heroDate: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  heroHour: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
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
  // === Chips ===
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
  // === Summary card V/N/D ===
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
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summaryLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  countDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    alignSelf: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  proportionBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryCounts: {
    flexDirection: 'row',
  },
  // === Match list ===
  matchList: {
    gap: 0,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchDate: {
    fontSize: 11,
    fontWeight: '600',
    width: 44,
  },
  matchTeams: {
    flex: 1,
    gap: 4,
  },
  teamLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  teamLogoMini: {
    width: 16,
    height: 16,
  },
  teamLogoMiniPlaceholder: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(10,10,10,0.06)',
  },
  matchTeamName: {
    fontSize: 13,
    flexShrink: 1,
  },
  matchScore: {
    alignItems: 'center',
    gap: 4,
    minWidth: 18,
  },
  matchScoreText: {
    fontSize: 13,
    fontWeight: '800',
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
  // === Saison ===
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  saisonCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  saisonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingBottom: 6,
  },
  saisonHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  saisonLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 6,
  },
  comparisonRow: {
    gap: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  comparisonValue: {
    fontSize: 14,
    fontWeight: '800',
    minWidth: 38,
  },
  comparisonLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  comparisonBars: {
    flexDirection: 'row',
    height: 6,
    gap: 4,
  },
  comparisonBarHalf: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  comparisonBarFill: {
    height: 6,
    borderRadius: 3,
  },
  // === Classement ===
  standingsCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  standingsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  standingsTitleText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  standingsHeader: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  standingsHeaderCell: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  standingsRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  standingsCell: {
    fontSize: 13,
  },
  standingsTeamCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  standingsTeamLogo: {
    width: 18,
    height: 18,
  },
  standingsTeamLogoPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(10,10,10,0.06)',
  },
  colPos: {
    width: 24,
    textAlign: 'center',
  },
  colTeam: {
    flex: 1,
    paddingHorizontal: 8,
  },
  colSmall: {
    width: 36,
    textAlign: 'center',
  },
  // === No stats ===
  noStats: {
    alignItems: 'center',
    paddingVertical: Spacing.six,
    gap: Spacing.two,
  },
  noStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  noStatsBody: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.four,
  },
});
