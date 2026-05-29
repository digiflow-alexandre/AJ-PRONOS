/**
 * Fixtures AJ Pronos — VRAIES données importées depuis site/src/lib/data.ts.
 * Aucun pari fake : que des paris historiques réels qu'Alex a publiés.
 *
 * - 11 paris simples (Mai 2026)
 * - 98 combinés (Janvier → Avril 2026, importés via combo-fixtures.ts)
 *
 * Sera remplacé par la data Supabase quand le backend sera branché
 * (agents IA, admin Julien, etc.).
 */

import type { AnyBet, ComboBet, Prono, Sport } from '@/types/prono';

import { buildComboBetFixtures } from './combo-fixtures';
import { makeFootballStats } from './fake-stats';

// =============================================================================
// Helpers : date ISO depuis (day, month, year)
// =============================================================================
function dateAt(year: number, month: number, day: number, hour = 21): string {
  return new Date(year, month, day, hour, 0, 0, 0).toISOString();
}

// =============================================================================
// Logos équipes (CDN API-Sports + drapeaux pour le tennis)
// =============================================================================
const LOGO = {
  psg: 'https://media.api-sports.io/football/teams/85.png',
  lyon: 'https://media.api-sports.io/football/teams/80.png',
  marseille: 'https://media.api-sports.io/football/teams/81.png',
  nice: 'https://media.api-sports.io/football/teams/84.png',
  lille: 'https://media.api-sports.io/football/teams/79.png',
  lens: 'https://media.api-sports.io/football/teams/116.png',
  dortmund: 'https://media.api-sports.io/football/teams/165.png',
  mainz: 'https://media.api-sports.io/football/teams/164.png',
  realMadrid: 'https://media.api-sports.io/football/teams/541.png',
  girona: 'https://media.api-sports.io/football/teams/547.png',
  barcelona: 'https://media.api-sports.io/football/teams/529.png',
  valencia: 'https://media.api-sports.io/football/teams/532.png',
  atletico: 'https://media.api-sports.io/football/teams/530.png',
  athletic: 'https://media.api-sports.io/football/teams/531.png',
  arsenal: 'https://media.api-sports.io/football/teams/42.png',
  chelsea: 'https://media.api-sports.io/football/teams/49.png',
  liverpool: 'https://media.api-sports.io/football/teams/40.png',
  tottenham: 'https://media.api-sports.io/football/teams/47.png',
  inter: 'https://media.api-sports.io/football/teams/505.png',
  torino: 'https://media.api-sports.io/football/teams/503.png',
  bayer: 'https://media.api-sports.io/football/teams/168.png',
  roma: 'https://media.api-sports.io/football/teams/497.png',
};

// =============================================================================
// PARIS SIMPLES — Mai 2026 (importés depuis site/src/lib/data.ts)
// =============================================================================

type ProNoRaw = Omit<Prono, 'type'>;

/**
 * Helper : crée un Prono à partir des infos brutes.
 * Devine teamHome/teamAway en splittant le match sur " - ".
 */
function makeSimpleBet(opts: {
  id: string;
  day: number;
  month: number;     // 0-11
  year: number;
  hour?: number;
  match: string;      // "PSG - Lyon"
  prediction: string;
  odd: number;
  result: 'win' | 'loss';
  sport: Sport;
  competition: string;
  teamHomeLogo?: string;
  teamAwayLogo?: string;
  minTier?: Prono['minTier'];
  finalScore?: string;
}): ProNoRaw {
  const [teamHome, teamAway] = opts.match.split(' - ');
  return {
    id: opts.id,
    sport: opts.sport,
    competition: opts.competition,
    teamHome: teamHome.trim(),
    teamAway: teamAway.trim(),
    teamHomeLogo: opts.teamHomeLogo,
    teamAwayLogo: opts.teamAwayLogo,
    matchStartAt: dateAt(opts.year, opts.month, opts.day, opts.hour ?? 21),
    prediction: opts.prediction,
    odd: opts.odd,
    confidence:
      opts.odd < 1.6 ? 5 : opts.odd < 2 ? 4 : opts.odd < 2.5 ? 3 : 2,
    reasoning: `Analyse AJ Pronos sur ${opts.match}. ${opts.prediction} à la cote ${opts.odd}.`,
    minTier: opts.minTier ?? 'starter',
    publishedAt: dateAt(opts.year, opts.month, opts.day, 10),
    result: opts.result,
    finalScore: opts.finalScore,
  };
}

const SIMPLE_BETS_RAW: ProNoRaw[] = [
  // ===== MAI 2026 (11 paris) =====
  makeSimpleBet({
    id: 's-mai-11', year: 2026, month: 4, day: 11,
    match: 'PSG - Lyon', prediction: 'Plus de 2.5 buts', odd: 1.78, result: 'win',
    sport: 'foot', competition: 'Ligue 1',
    teamHomeLogo: LOGO.psg, teamAwayLogo: LOGO.lyon,
  }),
  makeSimpleBet({
    id: 's-mai-10', year: 2026, month: 4, day: 10,
    match: 'Real Madrid - Girona', prediction: 'Victoire Real', odd: 1.42, result: 'win',
    sport: 'foot', competition: 'La Liga',
    teamHomeLogo: LOGO.realMadrid, teamAwayLogo: LOGO.girona,
  }),
  makeSimpleBet({
    id: 's-mai-09', year: 2026, month: 4, day: 9,
    match: 'Bayer - Roma', prediction: 'Les deux équipes marquent', odd: 1.95, result: 'loss',
    sport: 'foot', competition: 'Europa League',
    teamHomeLogo: LOGO.bayer, teamAwayLogo: LOGO.roma,
  }),
  makeSimpleBet({
    id: 's-mai-08', year: 2026, month: 4, day: 8,
    match: 'Arsenal - Chelsea', prediction: 'Victoire Arsenal', odd: 1.65, result: 'win',
    sport: 'foot', competition: 'Premier League',
    teamHomeLogo: LOGO.arsenal, teamAwayLogo: LOGO.chelsea,
  }),
  makeSimpleBet({
    id: 's-mai-07', year: 2026, month: 4, day: 7,
    match: 'Atlético - Athletic', prediction: 'Moins de 3.5 buts', odd: 1.58, result: 'win',
    sport: 'foot', competition: 'La Liga',
    teamHomeLogo: LOGO.atletico, teamAwayLogo: LOGO.athletic,
  }),
  makeSimpleBet({
    id: 's-mai-06', year: 2026, month: 4, day: 6,
    match: 'Marseille - Nice', prediction: 'Victoire OM', odd: 2.10, result: 'loss',
    sport: 'foot', competition: 'Ligue 1',
    teamHomeLogo: LOGO.marseille, teamAwayLogo: LOGO.nice,
  }),
  makeSimpleBet({
    id: 's-mai-05', year: 2026, month: 4, day: 5,
    match: 'Inter - Torino', prediction: 'Plus de 2.5 buts', odd: 1.72, result: 'win',
    sport: 'foot', competition: 'Serie A',
    teamHomeLogo: LOGO.inter, teamAwayLogo: LOGO.torino,
  }),
  makeSimpleBet({
    id: 's-mai-04', year: 2026, month: 4, day: 4,
    match: 'Liverpool - Tottenham', prediction: 'Liverpool & +2.5', odd: 2.20, result: 'win',
    sport: 'foot', competition: 'Premier League',
    teamHomeLogo: LOGO.liverpool, teamAwayLogo: LOGO.tottenham,
  }),
  makeSimpleBet({
    id: 's-mai-03', year: 2026, month: 4, day: 3,
    match: 'Dortmund - Mainz', prediction: 'Victoire Dortmund', odd: 1.50, result: 'win',
    sport: 'foot', competition: 'Bundesliga',
    teamHomeLogo: LOGO.dortmund, teamAwayLogo: LOGO.mainz,
  }),
  makeSimpleBet({
    id: 's-mai-02', year: 2026, month: 4, day: 2,
    match: 'Lille - Lens', prediction: 'Match nul ou Lens', odd: 1.92, result: 'loss',
    sport: 'foot', competition: 'Ligue 1',
    teamHomeLogo: LOGO.lille, teamAwayLogo: LOGO.lens,
  }),
  makeSimpleBet({
    id: 's-mai-01', year: 2026, month: 4, day: 1,
    match: 'Barcelone - Valence', prediction: 'Victoire Barça -1.5', odd: 2.05, result: 'win',
    sport: 'foot', competition: 'La Liga',
    teamHomeLogo: LOGO.barcelona, teamAwayLogo: LOGO.valencia,
  }),
];

/**
 * Auto-injection :
 * - `type: 'single'` (discriminant union AnyBet)
 * - stats fictives pour les pronos foot (à retirer quand on branchera
 *   API-Football qui fournira les vraies stats)
 */
export const PRONOS_FIXTURES: Prono[] = SIMPLE_BETS_RAW.map((raw) => {
  const p: Prono = { ...raw, type: 'single' };
  if (!p.stats && p.sport === 'foot') {
    return { ...p, stats: makeFootballStats(p) };
  }
  return p;
});

// =============================================================================
// COMBINÉS — Jan→Avril 2026 (98 combinés importés depuis site)
// =============================================================================
export const COMBO_FIXTURES: ComboBet[] = buildComboBetFixtures();

// =============================================================================
// Liste unifiée (simples + combinés) — utilisée par tous les écrans
// =============================================================================
export const ALL_BETS: AnyBet[] = [...PRONOS_FIXTURES, ...COMBO_FIXTURES];
