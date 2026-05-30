/**
 * Génération déterministe (PRNG seed sur id) de stats tennis fictives
 * pour un prono tennis donné.
 * Sera remplacé par API tennis quand le backend sera branché.
 */

import type {
  CurrentTournament,
  PlayerProfile,
  TennisMatch,
  TennisStats,
  TennisSurface,
} from '@/types/tennis-stats';

import { getPlayerFlag } from './team-logos';

// =============================================================================
// PRNG simple seedé sur une string (cohérence entre rebuilds)
// =============================================================================
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

// =============================================================================
// Tournois & surfaces
// =============================================================================

/** Détecte la surface du tournoi à partir de son nom. */
export function getTournamentSurface(tournamentName: string): TennisSurface {
  const t = tournamentName.toLowerCase();
  if (t.includes('roland') || t.includes('rome') || t.includes('madrid')) {
    return 'terre';
  }
  if (t.includes('wimbledon')) return 'gazon';
  return 'dur'; // US Open, ATP Paris (indoor), Australian Open, etc.
}

/** Drapeau du pays organisateur d'un tournoi. */
function getTournamentFlag(tournamentName: string): string | undefined {
  const t = tournamentName.toLowerCase();
  if (t.includes('roland') || t.includes('atp paris')) return 'https://flagcdn.com/w80/fr.png';
  if (t.includes('rome')) return 'https://flagcdn.com/w80/it.png';
  if (t.includes('madrid')) return 'https://flagcdn.com/w80/es.png';
  if (t.includes('wimbledon')) return 'https://flagcdn.com/w80/gb.png';
  if (t.includes('us open')) return 'https://flagcdn.com/w80/us.png';
  if (t.includes('australian')) return 'https://flagcdn.com/w80/au.png';
  return undefined;
}

// =============================================================================
// Pool tournois + adversaires
// =============================================================================
const TOURNAMENT_POOL: { name: string; surface: TennisSurface }[] = [
  { name: 'ATP Rome', surface: 'terre' },
  { name: 'ATP Madrid', surface: 'terre' },
  { name: 'Roland-Garros', surface: 'terre' },
  { name: 'ATP Monte-Carlo', surface: 'terre' },
  { name: 'Wimbledon', surface: 'gazon' },
  { name: 'ATP Halle', surface: 'gazon' },
  { name: 'Queen\'s', surface: 'gazon' },
  { name: 'US Open', surface: 'dur' },
  { name: 'Australian Open', surface: 'dur' },
  { name: 'ATP Indian Wells', surface: 'dur' },
  { name: 'ATP Miami', surface: 'dur' },
  { name: 'ATP Paris', surface: 'dur' },
  { name: 'ATP Cincinnati', surface: 'dur' },
  { name: 'ATP Shanghai', surface: 'dur' },
];

const PLAYER_POOL = [
  'Alcaraz', 'Sinner', 'Djokovic', 'Medvedev', 'Zverev', 'Ruud',
  'Rublev', 'Tsitsipas', 'Fritz', 'Rune', 'De Minaur', 'Hurkacz',
  'Dimitrov', 'Auger-Aliassime', 'Khachanov', 'Bublik',
];

// =============================================================================
// Génération profil joueur
// =============================================================================
function makePlayerProfile(
  rand: () => number,
  playerName: string,
  currentSurface: TennisSurface,
): PlayerProfile {
  const cleanName = playerName.replace(/\s*\([A-Z]+\)\s*$/, '').trim();

  return {
    fullName: cleanName,
    flag: getPlayerFlag(playerName),
    // Bio
    age: 20 + Math.floor(rand() * 15),
    rankingAtp: 1 + Math.floor(rand() * 30),
    rankingRace: 1 + Math.floor(rand() * 50),
    handedness: rand() < 0.85 ? 'droite' : 'gauche',
    heightCm: 175 + Math.floor(rand() * 25),
    turnedProYear: 2010 + Math.floor(rand() * 12),
    // Saison
    seasonWinRate: Math.round(55 + rand() * 35),
    seasonSurfaceWinRate: Math.round(60 + rand() * 32),
    seasonTitles: Math.floor(rand() * 5),
    // Carrière
    careerWinRate: Math.round(60 + rand() * 28),
    careerSurfaceWinRate: Math.round(60 + rand() * 30),
    careerTitles: 2 + Math.floor(rand() * 25),
  };
}

// =============================================================================
// Génération matchs récents
// =============================================================================
function pickOpponent(rand: () => number, ownName: string): string {
  const clean = ownName.replace(/\s*\([A-Z]+\)\s*$/, '').trim();
  const pool = PLAYER_POOL.filter((p) => p !== clean);
  return pool[Math.floor(rand() * pool.length)];
}

function pickSetScore(
  rand: () => number,
  result: 'V' | 'D',
  surface: TennisSurface,
): string {
  // Grand Chelem (3 sets gagnants) sur terre/gazon/dur → 5 sets max
  // On simplifie : 3 sets max pour la plupart, 5 sets pour quelques cas
  const fiveSetsChance = surface === 'gazon' ? 0.15 : surface === 'terre' ? 0.2 : 0.1;
  const isBestOf5 = rand() < fiveSetsChance;

  if (isBestOf5) {
    if (result === 'V') {
      const opp = Math.floor(rand() * 3); // 0, 1 ou 2
      return `3-${opp}`;
    }
    const own = Math.floor(rand() * 3);
    return `${own}-3`;
  }

  // Best of 3 (standard ATP 1000, 500, 250)
  if (result === 'V') {
    return rand() < 0.7 ? '2-0' : '2-1';
  }
  return rand() < 0.7 ? '0-2' : '1-2';
}

function genTennisMatches(
  rand: () => number,
  count = 30,
): TennisMatch[] {
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    // Date dégradée (1 match tous les 5-10 jours)
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1) * (5 + Math.floor(rand() * 5)));
    const dd = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.`;

    const tournament = TOURNAMENT_POOL[Math.floor(rand() * TOURNAMENT_POOL.length)];
    const opponent = pickOpponent(rand, '');
    const result: 'V' | 'D' = rand() < 0.65 ? 'V' : 'D';
    const scoreSets = pickSetScore(rand, result, tournament.surface);

    return {
      date: dd,
      tournament: tournament.name,
      tournamentFlag: getTournamentFlag(tournament.name),
      surface: tournament.surface,
      opponent,
      opponentFlag: getPlayerFlag(opponent),
      scoreSets,
      result,
    };
  });
}

// =============================================================================
// Génération H2H tennis
// =============================================================================
function genTennisH2H(
  rand: () => number,
  awayPlayerName: string,
  count = 8,
): TennisMatch[] {
  const today = new Date();
  const cleanOpp = awayPlayerName.replace(/\s*\([A-Z]+\)\s*$/, '').trim();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - (i + 1) * 4 - Math.floor(rand() * 3));
    const dd = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.`;

    const tournament = TOURNAMENT_POOL[Math.floor(rand() * TOURNAMENT_POOL.length)];
    const result: 'V' | 'D' = rand() < 0.55 ? 'V' : 'D';
    const scoreSets = pickSetScore(rand, result, tournament.surface);

    return {
      date: dd,
      tournament: tournament.name,
      tournamentFlag: getTournamentFlag(tournament.name),
      surface: tournament.surface,
      opponent: cleanOpp,
      opponentFlag: getPlayerFlag(awayPlayerName),
      scoreSets,
      result,
    };
  });
}

// =============================================================================
// Génère TennisStats complet pour un prono tennis
// =============================================================================
export function makeTennisStats(opts: {
  id: string;
  teamHome: string;
  teamAway: string;
  competition: string;
}): TennisStats {
  const rand = seedFrom(opts.id);
  const surface = getTournamentSurface(opts.competition);
  const tournament: CurrentTournament = {
    name: opts.competition,
    surface,
  };

  return {
    tournament,
    homeProfile: makePlayerProfile(rand, opts.teamHome, surface),
    awayProfile: makePlayerProfile(rand, opts.teamAway, surface),
    homeMatches: genTennisMatches(rand, 30),
    awayMatches: genTennisMatches(rand, 30),
    h2hMatches: genTennisH2H(rand, opts.teamAway, 8),
  };
}
