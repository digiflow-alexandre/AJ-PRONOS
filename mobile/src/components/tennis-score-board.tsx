import { StyleSheet, Text, View } from 'react-native';

import { Radius } from '@/constants/theme';
import { useThemeColors } from '@/lib/use-theme-colors';

/**
 * Scoreboard tennis style Eurosport / ATP : 2 lignes (joueurs) × N cases (sets).
 * Gagnant du set en gras + couleur or, perdant en muted.
 *
 * Formats acceptés pour `score` :
 *  - simple : "6-4 6-3" ou "7-6 3-7 6-7 7-6 4-6"
 *  - avec tiebreaks : "7-6(7-5) 3-6 6-7(3-7) 7-6(7-2) 6-4"
 *    → le nombre entre parenthèses = score du jeu décisif côté perdant,
 *      affiché en exposant.
 */

type Player = {
  name: string;
  /** Drapeau emoji ou URL — pour l'instant emoji (extensible plus tard). */
  flag?: string;
};

type ParsedSet = {
  home: number;
  away: number;
  homeTb?: number;
  awayTb?: number;
};

function parseScore(score: string): ParsedSet[] {
  const tokens = score.trim().split(/\s+/);
  const sets: ParsedSet[] = [];
  for (const t of tokens) {
    // "7-6(7-5)" → match
    const m = t.match(/^(\d+)-(\d+)(?:\((\d+)-(\d+)\))?$/);
    if (!m) continue;
    const home = parseInt(m[1], 10);
    const away = parseInt(m[2], 10);
    // Tiebreak : on affiche les 2 scores (home et away) en exposant pour
    // que les 2 joueurs aient leur petit chiffre, style ATP/Eurosport
    // étendu. Format dans les parenthèses : "(home_tb)-(away_tb)".
    let homeTb: number | undefined;
    let awayTb: number | undefined;
    if (m[3] !== undefined && m[4] !== undefined) {
      homeTb = parseInt(m[3], 10);
      awayTb = parseInt(m[4], 10);
    }
    sets.push({ home, away, homeTb, awayTb });
  }
  return sets;
}

export function TennisScoreBoard({
  home,
  away,
  score,
  compact,
}: {
  home: Player;
  away: Player;
  score: string;
  /** Mode compact : juste les cases sets, sans les noms à gauche.
   *  Utile quand les noms des joueurs sont déjà affichés autour
   *  (ex: Stats Center où on a les avatars de chaque côté). */
  compact?: boolean;
}) {
  const c = useThemeColors();
  const sets = parseScore(score);
  if (sets.length === 0) {
    return (
      <View style={styles.fallback}>
        <Text style={[styles.fallbackText, { color: c.text }]}>{score}</Text>
      </View>
    );
  }

  if (compact) {
    return (
      <View style={styles.setsCol}>
        {sets.map((s, i) => (
          <SetBox key={i} set={s} c={c} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.playersCol}>
        <PlayerRow player={home} />
        <PlayerRow player={away} />
      </View>
      <View style={styles.setsCol}>
        {sets.map((s, i) => (
          <SetBox key={i} set={s} c={c} />
        ))}
      </View>
    </View>
  );
}

function PlayerRow({ player }: { player: Player }) {
  const c = useThemeColors();
  return (
    <View style={styles.playerRow}>
      {player.flag ? <Text style={styles.flag}>{player.flag}</Text> : null}
      <Text
        style={[styles.playerName, { color: c.text }]}
        numberOfLines={1}>
        {player.name}
      </Text>
    </View>
  );
}

function SetBox({
  set,
  c,
}: {
  set: ParsedSet;
  c: ReturnType<typeof useThemeColors>;
}) {
  const homeWon = set.home > set.away;
  const awayWon = set.away > set.home;
  return (
    <View style={styles.setBox}>
      <View
        style={[
          styles.cell,
          {
            backgroundColor: homeWon ? c.bgElevated : 'rgba(20,20,20,0.6)',
            borderColor: c.borderFaint,
          },
        ]}>
        <Text
          style={[
            styles.cellNum,
            {
              color: homeWon ? c.text : c.textMuted,
              fontWeight: homeWon ? '800' : '500',
            },
          ]}>
          {set.home}
        </Text>
        {set.homeTb !== undefined ? (
          <Text style={[styles.tb, { color: c.textMuted }]}>{set.homeTb}</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.cell,
          {
            backgroundColor: awayWon ? c.bgElevated : 'rgba(20,20,20,0.6)',
            borderColor: c.borderFaint,
          },
        ]}>
        <Text
          style={[
            styles.cellNum,
            {
              color: awayWon ? c.text : c.textMuted,
              fontWeight: awayWon ? '800' : '500',
            },
          ]}>
          {set.away}
        </Text>
        {set.awayTb !== undefined ? (
          <Text style={[styles.tb, { color: c.textMuted }]}>{set.awayTb}</Text>
        ) : null}
      </View>
    </View>
  );
}

const CELL_SIZE = 36;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
  },
  playersCol: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: CELL_SIZE,
  },
  flag: {
    fontSize: 18,
  },
  playerName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  setsCol: {
    flexDirection: 'row',
    gap: 4,
  },
  setBox: {
    gap: 4,
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cellNum: {
    fontSize: 17,
    letterSpacing: -0.3,
  },
  tb: {
    fontSize: 9,
    fontWeight: '600',
    marginLeft: 1,
    marginTop: -8,
  },
  fallback: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});
