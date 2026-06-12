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
import { MAI_2026_REAL_COMBOS } from './mai-real-fixtures';
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

// Paris simples : vidé pour mai 2026 — remplacés par les 29 vrais combinés
// Winamax (MAI_2026_REAL_COMBOS) extraits depuis les tickets du dossier
// PARIS MAI/. À regarnir quand on aura des paris simples réels à intégrer.
const SIMPLE_BETS_RAW: ProNoRaw[] = [];

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
export const ALL_BETS: AnyBet[] = [
  ...PRONOS_FIXTURES,
  ...COMBO_FIXTURES,
  ...MAI_2026_REAL_COMBOS,
];
