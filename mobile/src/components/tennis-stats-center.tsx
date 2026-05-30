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

// ============= PROFIL =============
function ProfilPanel({
  prono,
  stats,
}: {
  prono: Prono;
  stats: TennisStats;
}) {
  const c = useThemeColors();
  const surfaceLabel = SURFACE_LABEL[stats.tournament.surface];

  return (
    <View style={{ gap: Spacing.three }}>
      <Text style={[styles.sectionLabel, { color: c.text }]}>
        Profil sur {stats.tournament.name}
      </Text>

      <View style={styles.playersSwitchRow}>
        <PlayerProfileCard
          profile={stats.homeProfile}
          name={prono.teamHome}
          surfaceLabel={surfaceLabel}
        />
        <PlayerProfileCard
          profile={stats.awayProfile}
          name={prono.teamAway}
          surfaceLabel={surfaceLabel}
        />
      </View>
    </View>
  );
}

function PlayerProfileCard({
  profile,
  name,
  surfaceLabel,
}: {
  profile: PlayerProfile;
  name: string;
  surfaceLabel: string;
}) {
  const c = useThemeColors();

  return (
    <View
      style={[
        styles.profileCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.goldDecorative,
          shadowColor: '#0A0A0A',
        },
      ]}>
      {/* Header avec nom + drapeau */}
      <View style={styles.profileHeader}>
        {profile.flag ? (
          <Image
            source={{ uri: profile.flag }}
            style={styles.profileFlag}
            contentFit="cover"
          />
        ) : null}
        <Text
          style={[styles.profileName, { color: c.text }]}
          numberOfLines={1}>
          {profile.fullName || name}
        </Text>
      </View>

      {/* BIO */}
      <SubBlock title="BIO" icon="person.fill">
        <Row label="Âge" value={profile.age ? `${profile.age} ans` : '—'} />
        <Row label="Classement ATP" value={profile.rankingAtp ? `#${profile.rankingAtp}` : '—'} />
        <Row label="Classement Race" value={profile.rankingRace ? `#${profile.rankingRace}` : '—'} />
        <Row label="Main forte" value={profile.handedness ? cap(profile.handedness) : '—'} />
        <Row label="Taille" value={profile.heightCm ? `${(profile.heightCm / 100).toFixed(2)} m` : '—'} />
        <Row label="Passage pro" value={profile.turnedProYear ? `${profile.turnedProYear}` : '—'} />
      </SubBlock>

      {/* SAISON */}
      <SubBlock title="SAISON" icon="calendar">
        <Row label="% Victoires" value={`${profile.seasonWinRate}%`} />
        <Row label={`% Sur ${surfaceLabel.toLowerCase()}`} value={`${profile.seasonSurfaceWinRate}%`} />
        <Row label="Titres" value={`${profile.seasonTitles}`} />
      </SubBlock>

      {/* CARRIÈRE */}
      <SubBlock title="CARRIÈRE" icon="trophy.fill">
        <Row label="% Victoires" value={`${profile.careerWinRate}%`} />
        <Row label={`% Sur ${surfaceLabel.toLowerCase()}`} value={`${profile.careerSurfaceWinRate}%`} />
        <Row label="Titres" value={`${profile.careerTitles}`} />
      </SubBlock>
    </View>
  );
}

function SubBlock({
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
    <View style={styles.subBlock}>
      <View style={styles.subBlockHeader}>
        <SymbolView name={icon as never} size={11} tintColor={c.gold} weight="semibold" />
        <Text style={[styles.subBlockTitle, { color: c.textMuted }]}>
          {title}
        </Text>
      </View>
      <View style={{ gap: 4 }}>{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.rowValue, { color: c.text }]}>{value}</Text>
    </View>
  );
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

      {/* Liste matchs */}
      {matches.length === 0 ? (
        <Text style={[styles.empty, { color: c.textMuted }]}>
          Aucun match récent sur {SURFACE_LABEL[surface].toLowerCase()}.
        </Text>
      ) : (
        <View>
          {matches.map((m, i) => (
            <TennisMatchRow key={i} match={m} />
          ))}
        </View>
      )}
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

function TennisMatchRow({ match }: { match: TennisMatch }) {
  const c = useThemeColors();
  const outcomeColor = match.result === 'V' ? COLOR_WIN : COLOR_LOSS;

  return (
    <View style={[styles.matchRow, { borderBottomColor: c.borderFaint }]}>
      <Text style={[styles.matchDate, { color: c.textDim }]}>{match.date}</Text>

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
  // Profil
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  playersSwitchRow: {
    gap: Spacing.three,
  },
  profileCard: {
    borderRadius: 16,
    borderWidth: 1.2,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileFlag: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  subBlock: {
    gap: 6,
  },
  subBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subBlockTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
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
