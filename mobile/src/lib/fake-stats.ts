import type { Prono } from '@/types/prono';
import type {
  MatchOutcome,
  ProNoStats,
  RecentMatch,
  StandingRow,
} from '@/types/stats';

/**
 * Génère des stats fictives DÉTERMINISTES à partir d'un prono foot.
 * (Tennis non supporté — placeholder reste affiché.)
 * Sera remplacé par API-Football quand le backend sera branché.
 */

// PRNG simple basé sur une chaîne (pour avoir des valeurs stables par prono).
function seedFrom(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pickOutcome(rand: () => number, bias: number): MatchOutcome {
  const v = rand();
  // bias > 0 favorise V, bias < 0 favorise D
  const winThreshold = 0.42 + bias;
  const drawThreshold = winThreshold + 0.25;
  if (v < winThreshold) return 'V';
  if (v < drawThreshold) return 'N';
  return 'D';
}

function pickOpponents(rand: () => number, ownTeam: string): string {
  const pool = [
    'Lille', 'Lyon', 'Marseille', 'Monaco', 'Lens', 'Nice', 'Brest',
    'Reims', 'Strasbourg', 'Toulouse', 'Nantes', 'Auxerre', 'Le Havre',
    'Rennes', 'Montpellier', 'Saint-Étienne', 'Angers',
  ].filter((t) => t !== ownTeam);
  return pool[Math.floor(rand() * pool.length)];
}

function genRecentMatches(
  rand: () => number,
  team: string,
  bias: number,
  count = 10,
): RecentMatch[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1) * 4 - Math.floor(rand() * 3));
    const dd = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.`;
    const result = pickOutcome(rand, bias);
    const isHome = rand() > 0.5;
    const scoreSelf =
      result === 'V'
        ? 1 + Math.floor(rand() * 3)
        : result === 'N'
          ? Math.floor(rand() * 3)
          : Math.floor(rand() * 2);
    const scoreOpp =
      result === 'D'
        ? scoreSelf + 1 + Math.floor(rand() * 2)
        : result === 'N'
          ? scoreSelf
          : Math.floor(rand() * scoreSelf);
    const opponent = pickOpponents(rand, team);
    return {
      date: dd,
      opponent,
      scoreHome: isHome ? scoreSelf : scoreOpp,
      scoreAway: isHome ? scoreOpp : scoreSelf,
      isHome,
      result,
    };
  });
}

function genH2H(
  rand: () => number,
  homeTeam: string,
  homeBias: number,
  count = 10,
): RecentMatch[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - (i + 1) * 4 - Math.floor(rand() * 3));
    const dd = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.`;
    const result = pickOutcome(rand, homeBias);
    const isHome = i % 2 === 0;
    const scoreSelf =
      result === 'V'
        ? 1 + Math.floor(rand() * 3)
        : result === 'N'
          ? Math.floor(rand() * 3)
          : Math.floor(rand() * 2);
    const scoreOpp =
      result === 'D'
        ? scoreSelf + 1 + Math.floor(rand() * 2)
        : result === 'N'
          ? scoreSelf
          : Math.floor(rand() * scoreSelf);
    return {
      date: dd,
      opponent: homeTeam, // l'adversaire est toujours le même (le team away)
      scoreHome: isHome ? scoreSelf : scoreOpp,
      scoreAway: isHome ? scoreOpp : scoreSelf,
      isHome,
      result,
    };
  });
}

function pickFromRange(
  rand: () => number,
  min: number,
  max: number,
  decimals = 1,
): number {
  const v = min + rand() * (max - min);
  const p = Math.pow(10, decimals);
  return Math.round(v * p) / p;
}

function competitionFromString(c: string): string {
  return c.split(' · ')[0] ?? c;
}

// Pools complets par compétition (avec le bon nombre d'équipes)
const COMPETITION_POOLS: Record<string, string[]> = {
  'Ligue 1': [
    'PSG', 'Monaco', 'Marseille', 'Lille', 'Nice', 'Lens',
    'Lyon', 'Strasbourg', 'Brest', 'Reims', 'Rennes', 'Nantes',
    'Toulouse', 'Auxerre', 'Le Havre', 'Angers', 'Montpellier', 'Saint-Étienne',
  ],
  'La Liga': [
    'Real Madrid', 'Barcelona', 'Atletico', 'Athletic', 'Villarreal', 'Real Sociedad',
    'Betis', 'Valence', 'Séville', 'Osasuna', 'Mallorca', 'Getafe',
    'Girona', 'Alavés', 'Las Palmas', 'Rayo', 'Espanyol', 'Leganés',
    'Celta Vigo', 'Valladolid',
  ],
  'Premier League': [
    'Liverpool', 'Arsenal', 'Man City', 'Chelsea', 'Tottenham', 'Newcastle',
    'Aston Villa', 'Brighton', 'Man United', 'West Ham', 'Brentford', 'Fulham',
    'Bournemouth', 'Crystal Palace', 'Nottingham', 'Wolves',
    'Everton', 'Leicester', 'Ipswich', 'Southampton',
  ],
  'Champions League': [
    'Man City', 'Bayern', 'Real Madrid', 'Arsenal', 'PSG', 'Inter',
    'Atletico', 'Barcelona', 'Borussia', 'Atalanta', 'Bayer', 'Milan',
    'Juventus', 'Sporting', 'Benfica', 'Celtic',
  ],
};

function buildStandings(
  rand: () => number,
  competition: string,
  homeTeam: string,
  awayTeam: string,
  homePos: number,
  awayPos: number,
): StandingRow[] {
  const compName = competitionFromString(competition);
  const teamsPool = COMPETITION_POOLS[compName] ?? COMPETITION_POOLS['Ligue 1'];
  const total = teamsPool.length;

  // Map position → équipe en s'assurant que home et away soient bien placés
  return Array.from({ length: total }, (_, i) => {
    const position = i + 1;
    let team: string;
    if (position === homePos) team = homeTeam;
    else if (position === awayPos) team = awayTeam;
    else {
      // Évite de reprendre home/away et avance dans le pool
      let pick = teamsPool[(position + Math.floor(rand() * 3)) % total];
      let safety = 0;
      while ((pick === homeTeam || pick === awayTeam) && safety < total) {
        pick = teamsPool[(safety + position) % total];
        safety++;
      }
      team = pick;
    }
    const wins = Math.max(1, 23 - position - Math.floor(rand() * 3));
    const draws = 3 + Math.floor(rand() * 7);
    const losses = Math.max(0, 31 - wins - draws);
    const goalsFor = wins * 2 + draws + Math.floor(rand() * 12);
    const goalsAgainst = losses * 2 + draws + Math.floor(rand() * 10);
    return {
      position,
      team,
      played: wins + draws + losses,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      goalDiff: goalsFor - goalsAgainst,
      points: wins * 3 + draws,
    };
  });
}

export function makeFootballStats(prono: Prono): ProNoStats {
  const rand = seedFrom(prono.id);
  const homeBias = (rand() - 0.5) * 0.15;
  const awayBias = (rand() - 0.5) * 0.15;
  const compName = competitionFromString(prono.competition);

  const homePosition = Math.max(1, Math.floor(rand() * 12) + 1);
  let awayPosition = Math.max(1, Math.floor(rand() * 12) + 1);
  if (awayPosition === homePosition) awayPosition = (awayPosition % 12) + 1;

  return {
    homePosition,
    awayPosition,
    homeRecentMatches: genRecentMatches(rand, prono.teamHome, homeBias),
    awayRecentMatches: genRecentMatches(rand, prono.teamAway, awayBias),
    h2hMatches: genH2H(rand, prono.teamAway, homeBias),
    homeSeasonStats: {
      competition: compName,
      goalsForPerMatch: pickFromRange(rand, 1.0, 2.8),
      goalsAgainstPerMatch: pickFromRange(rand, 0.4, 1.6),
      possessionPct: Math.round(pickFromRange(rand, 42, 66, 0)),
      shotsPerMatch: pickFromRange(rand, 9, 18),
      shotsOnTargetPerMatch: pickFromRange(rand, 3, 8),
      cornersPerMatch: pickFromRange(rand, 3.5, 6.5),
      freeKicksPerMatch: pickFromRange(rand, 7, 13),
      chancesPerMatch: pickFromRange(rand, 8, 13),
      cleanSheets: Math.floor(pickFromRange(rand, 4, 14, 0)),
      yellowCards: Math.floor(pickFromRange(rand, 25, 60, 0)),
      redCards: Math.floor(pickFromRange(rand, 0, 4, 0)),
    },
    awaySeasonStats: {
      competition: compName,
      goalsForPerMatch: pickFromRange(rand, 1.0, 2.8),
      goalsAgainstPerMatch: pickFromRange(rand, 0.4, 1.6),
      possessionPct: Math.round(pickFromRange(rand, 42, 66, 0)),
      shotsPerMatch: pickFromRange(rand, 9, 18),
      shotsOnTargetPerMatch: pickFromRange(rand, 3, 8),
      cornersPerMatch: pickFromRange(rand, 3.5, 6.5),
      freeKicksPerMatch: pickFromRange(rand, 7, 13),
      chancesPerMatch: pickFromRange(rand, 8, 13),
      cleanSheets: Math.floor(pickFromRange(rand, 4, 14, 0)),
      yellowCards: Math.floor(pickFromRange(rand, 25, 60, 0)),
      redCards: Math.floor(pickFromRange(rand, 0, 4, 0)),
    },
    standings: buildStandings(
      rand,
      compName,
      prono.teamHome,
      prono.teamAway,
      homePosition,
      awayPosition,
    ),
    standingsLabel: `Classement ${compName}`,
  };
}
