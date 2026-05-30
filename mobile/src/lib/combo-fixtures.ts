/**
 * Fixtures combinés : conversion des combinés historiques du site
 * (Jan-Avril 2026, 96 entrées avec uniquement cote totale + résultat)
 * en ComboBet structurés avec sélections mockées.
 *
 * Sera remplacé par la vraie data Supabase quand Julien rentrera les
 * combinés de manière structurée via l'admin.
 */

import type { ComboBet, ComboBetSelection, PronoResult, Sport } from '@/types/prono';

import { makeFootballStats } from './fake-stats';
import { makeTennisStats } from './fake-tennis-stats';
import { getCompetitorLogo } from './team-logos';

// Type abrégé pour la source : ce qu'on récupère du site/data.ts
type RawCombo = {
  id: string;
  day: string;             // "11"
  month: 'janvier' | 'fevrier' | 'mars' | 'avril';
  combinationOdd: number;
  result: 'win' | 'loss';
  primarySport: Sport;     // sport "principal" pour mocker
};

// =============================================================================
// Données brutes du site (Jan-Avril)
// =============================================================================
const RAW_COMBOS: RawCombo[] = [
  // ===== AVRIL (26 paris) =====
  { id: 'c-avr-30', day: '30', month: 'avril', combinationOdd: 3.40, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-29', day: '29', month: 'avril', combinationOdd: 2.75, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-28', day: '28', month: 'avril', combinationOdd: 4.20, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-27', day: '27', month: 'avril', combinationOdd: 3.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-26', day: '26', month: 'avril', combinationOdd: 2.95, result: 'loss', primarySport: 'tennis' },
  { id: 'c-avr-25', day: '25', month: 'avril', combinationOdd: 5.40, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-24', day: '24', month: 'avril', combinationOdd: 2.30, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-23', day: '23', month: 'avril', combinationOdd: 3.65, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-22', day: '22', month: 'avril', combinationOdd: 1.95, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-21', day: '21', month: 'avril', combinationOdd: 3.20, result: 'loss', primarySport: 'foot' },
  { id: 'c-avr-20', day: '20', month: 'avril', combinationOdd: 4.85, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-19', day: '19', month: 'avril', combinationOdd: 2.55, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-18', day: '18', month: 'avril', combinationOdd: 3.95, result: 'loss', primarySport: 'foot' },
  { id: 'c-avr-17', day: '17', month: 'avril', combinationOdd: 2.10, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-16', day: '16', month: 'avril', combinationOdd: 5.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-15', day: '15', month: 'avril', combinationOdd: 3.45, result: 'loss', primarySport: 'foot' },
  { id: 'c-avr-14', day: '14', month: 'avril', combinationOdd: 2.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-13', day: '13', month: 'avril', combinationOdd: 4.30, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-12', day: '12', month: 'avril', combinationOdd: 3.75, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-11', day: '11', month: 'avril', combinationOdd: 2.45, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-10', day: '10', month: 'avril', combinationOdd: 5.60, result: 'win',  primarySport: 'tennis' },
  { id: 'c-avr-08', day: '08', month: 'avril', combinationOdd: 3.30, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-07', day: '07', month: 'avril', combinationOdd: 2.70, result: 'win',  primarySport: 'foot' },
  { id: 'c-avr-05', day: '05', month: 'avril', combinationOdd: 3.85, result: 'loss', primarySport: 'tennis' },
  { id: 'c-avr-03', day: '03', month: 'avril', combinationOdd: 4.50, result: 'loss', primarySport: 'foot' },
  { id: 'c-avr-01', day: '01', month: 'avril', combinationOdd: 2.20, result: 'win',  primarySport: 'foot' },

  // ===== MARS (24 paris — 19 wins, 5 losses) =====
  { id: 'c-mar-31', day: '31', month: 'mars', combinationOdd: 3.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-30', day: '30', month: 'mars', combinationOdd: 2.95, result: 'win',  primarySport: 'tennis' },
  { id: 'c-mar-29', day: '29', month: 'mars', combinationOdd: 4.20, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-28', day: '28', month: 'mars', combinationOdd: 2.45, result: 'loss', primarySport: 'foot' },
  { id: 'c-mar-27', day: '27', month: 'mars', combinationOdd: 3.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-25', day: '25', month: 'mars', combinationOdd: 5.40, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-24', day: '24', month: 'mars', combinationOdd: 2.65, result: 'win',  primarySport: 'tennis' },
  { id: 'c-mar-23', day: '23', month: 'mars', combinationOdd: 3.75, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-22', day: '22', month: 'mars', combinationOdd: 2.20, result: 'loss', primarySport: 'foot' },
  { id: 'c-mar-21', day: '21', month: 'mars', combinationOdd: 4.85, result: 'win',  primarySport: 'tennis' },
  { id: 'c-mar-20', day: '20', month: 'mars', combinationOdd: 2.30, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-19', day: '19', month: 'mars', combinationOdd: 3.40, result: 'win',  primarySport: 'tennis' },
  { id: 'c-mar-18', day: '18', month: 'mars', combinationOdd: 2.75, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-17', day: '17', month: 'mars', combinationOdd: 3.95, result: 'loss', primarySport: 'foot' },
  { id: 'c-mar-16', day: '16', month: 'mars', combinationOdd: 1.95, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-15', day: '15', month: 'mars', combinationOdd: 5.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-13', day: '13', month: 'mars', combinationOdd: 3.25, result: 'win',  primarySport: 'tennis' },
  { id: 'c-mar-12', day: '12', month: 'mars', combinationOdd: 2.55, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-10', day: '10', month: 'mars', combinationOdd: 4.65, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-09', day: '09', month: 'mars', combinationOdd: 2.85, result: 'loss', primarySport: 'tennis' },
  { id: 'c-mar-07', day: '07', month: 'mars', combinationOdd: 3.60, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-06', day: '06', month: 'mars', combinationOdd: 2.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-mar-04', day: '04', month: 'mars', combinationOdd: 3.15, result: 'loss', primarySport: 'foot' },
  { id: 'c-mar-02', day: '02', month: 'mars', combinationOdd: 4.30, result: 'win',  primarySport: 'foot' },

  // ===== FÉVRIER (18 paris — 14 wins, 4 losses) =====
  { id: 'c-fev-28', day: '28', month: 'fevrier', combinationOdd: 4.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-27', day: '27', month: 'fevrier', combinationOdd: 3.25, result: 'win',  primarySport: 'tennis' },
  { id: 'c-fev-26', day: '26', month: 'fevrier', combinationOdd: 2.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-24', day: '24', month: 'fevrier', combinationOdd: 5.20, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-22', day: '22', month: 'fevrier', combinationOdd: 3.40, result: 'loss', primarySport: 'foot' },
  { id: 'c-fev-21', day: '21', month: 'fevrier', combinationOdd: 2.65, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-19', day: '19', month: 'fevrier', combinationOdd: 4.50, result: 'win',  primarySport: 'tennis' },
  { id: 'c-fev-18', day: '18', month: 'fevrier', combinationOdd: 3.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-16', day: '16', month: 'fevrier', combinationOdd: 2.45, result: 'loss', primarySport: 'foot' },
  { id: 'c-fev-15', day: '15', month: 'fevrier', combinationOdd: 3.80, result: 'win',  primarySport: 'tennis' },
  { id: 'c-fev-14', day: '14', month: 'fevrier', combinationOdd: 2.20, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-12', day: '12', month: 'fevrier', combinationOdd: 5.50, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-10', day: '10', month: 'fevrier', combinationOdd: 3.90, result: 'loss', primarySport: 'foot' },
  { id: 'c-fev-09', day: '09', month: 'fevrier', combinationOdd: 2.95, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-08', day: '08', month: 'fevrier', combinationOdd: 1.95, result: 'win',  primarySport: 'tennis' },
  { id: 'c-fev-06', day: '06', month: 'fevrier', combinationOdd: 4.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-fev-04', day: '04', month: 'fevrier', combinationOdd: 3.05, result: 'loss', primarySport: 'foot' },
  { id: 'c-fev-02', day: '02', month: 'fevrier', combinationOdd: 3.55, result: 'win',  primarySport: 'tennis' },

  // ===== JANVIER (30 paris) =====
  { id: 'c-jan-30', day: '30', month: 'janvier', combinationOdd: 5.63, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-29', day: '29', month: 'janvier', combinationOdd: 3.20, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-28', day: '28', month: 'janvier', combinationOdd: 4.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-27', day: '27', month: 'janvier', combinationOdd: 2.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-26', day: '26', month: 'janvier', combinationOdd: 6.22, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-25', day: '25', month: 'janvier', combinationOdd: 7.22, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-24', day: '24', month: 'janvier', combinationOdd: 3.45, result: 'loss', primarySport: 'foot' },
  { id: 'c-jan-23', day: '23', month: 'janvier', combinationOdd: 2.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-22', day: '22', month: 'janvier', combinationOdd: 6.22, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-21', day: '21', month: 'janvier', combinationOdd: 1.95, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-20', day: '20', month: 'janvier', combinationOdd: 4.50, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-19', day: '19', month: 'janvier', combinationOdd: 5.10, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-18', day: '18', month: 'janvier', combinationOdd: 2.65, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-17', day: '17', month: 'janvier', combinationOdd: 3.30, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-16', day: '16', month: 'janvier', combinationOdd: 1.80, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-15', day: '15', month: 'janvier', combinationOdd: 4.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-14', day: '14', month: 'janvier', combinationOdd: 2.95, result: 'loss', primarySport: 'foot' },
  { id: 'c-jan-13', day: '13', month: 'janvier', combinationOdd: 3.75, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-12', day: '12', month: 'janvier', combinationOdd: 2.45, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-11', day: '11', month: 'janvier', combinationOdd: 5.60, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-10', day: '10', month: 'janvier', combinationOdd: 4.20, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-09', day: '09', month: 'janvier', combinationOdd: 1.85, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-08', day: '08', month: 'janvier', combinationOdd: 3.10, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-07', day: '07', month: 'janvier', combinationOdd: 6.40, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-06', day: '06', month: 'janvier', combinationOdd: 5.63, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-05', day: '05', month: 'janvier', combinationOdd: 2.30, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-04', day: '04', month: 'janvier', combinationOdd: 3.55, result: 'loss', primarySport: 'foot' },
  { id: 'c-jan-03', day: '03', month: 'janvier', combinationOdd: 4.95, result: 'win',  primarySport: 'foot' },
  { id: 'c-jan-02', day: '02', month: 'janvier', combinationOdd: 2.20, result: 'win',  primarySport: 'tennis' },
  { id: 'c-jan-01', day: '01', month: 'janvier', combinationOdd: 3.85, result: 'win',  primarySport: 'foot' },
];

// =============================================================================
// Pools de matchs réalistes pour mocker les sélections
// =============================================================================

type MatchTemplate = {
  sport: Sport;
  competition: string;
  teamHome: string;
  teamAway: string;
  prediction: string;
  /** Cote individuelle approximative du pari proposé. */
  odd: number;
};

const FOOT_TEMPLATES: MatchTemplate[] = [
  { sport: 'foot', competition: 'Ligue 1', teamHome: 'PSG', teamAway: 'Lyon', prediction: 'Victoire PSG', odd: 1.65 },
  { sport: 'foot', competition: 'Ligue 1', teamHome: 'Marseille', teamAway: 'Nice', prediction: 'Plus de 2,5 buts', odd: 1.78 },
  { sport: 'foot', competition: 'Ligue 1', teamHome: 'Monaco', teamAway: 'Lens', prediction: 'Les deux équipes marquent', odd: 1.85 },
  { sport: 'foot', competition: 'Ligue 1', teamHome: 'Lille', teamAway: 'Reims', prediction: 'Victoire Lille', odd: 1.55 },
  { sport: 'foot', competition: 'La Liga', teamHome: 'Real Madrid', teamAway: 'Atletico', prediction: 'Victoire Real', odd: 1.95 },
  { sport: 'foot', competition: 'La Liga', teamHome: 'Barcelona', teamAway: 'Villarreal', prediction: 'Victoire Barça', odd: 1.45 },
  { sport: 'foot', competition: 'Premier League', teamHome: 'Liverpool', teamAway: 'Tottenham', prediction: 'Plus de 2,5 buts', odd: 1.72 },
  { sport: 'foot', competition: 'Premier League', teamHome: 'Man City', teamAway: 'Brighton', prediction: 'Victoire Man City -1.5', odd: 1.90 },
  { sport: 'foot', competition: 'Premier League', teamHome: 'Arsenal', teamAway: 'Chelsea', prediction: 'Victoire Arsenal', odd: 1.95 },
  { sport: 'foot', competition: 'Bundesliga', teamHome: 'Bayern', teamAway: 'Dortmund', prediction: 'Bayern + Plus 2,5 buts', odd: 2.10 },
  { sport: 'foot', competition: 'Serie A', teamHome: 'Inter', teamAway: 'Juventus', prediction: 'Victoire Inter', odd: 2.05 },
  { sport: 'foot', competition: 'Serie A', teamHome: 'Milan', teamAway: 'Roma', prediction: 'Match nul', odd: 3.20 },
  { sport: 'foot', competition: 'Champions League', teamHome: 'Bayern', teamAway: 'PSG', prediction: 'Plus de 2,5 buts', odd: 1.65 },
];

const TENNIS_TEMPLATES: MatchTemplate[] = [
  { sport: 'tennis', competition: 'ATP Rome', teamHome: 'Alcaraz', teamAway: 'Sinner', prediction: 'Victoire Alcaraz', odd: 1.85 },
  { sport: 'tennis', competition: 'ATP Madrid', teamHome: 'Djokovic', teamAway: 'Ruud', prediction: 'Victoire Djokovic', odd: 1.40 },
  { sport: 'tennis', competition: 'Roland-Garros', teamHome: 'Zverev', teamAway: 'Medvedev', prediction: 'Plus de 3.5 sets', odd: 1.95 },
  { sport: 'tennis', competition: 'Wimbledon', teamHome: 'Fritz', teamAway: 'Tsitsipas', prediction: 'Victoire Fritz', odd: 2.10 },
  { sport: 'tennis', competition: 'ATP Paris', teamHome: 'Rune', teamAway: 'Dimitrov', prediction: 'Victoire Rune', odd: 1.75 },
  { sport: 'tennis', competition: 'US Open', teamHome: 'Auger-Aliassime', teamAway: 'Rublev', prediction: 'Match nul (1-1)', odd: 2.20 },
];

const FRENCH_MONTHS: Record<RawCombo['month'], number> = {
  janvier: 0,
  fevrier: 1,
  mars: 2,
  avril: 3,
};

// =============================================================================
// PRNG déterministe seedé sur id (cohérence entre rebuilds)
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
// Conversion : RawCombo → ComboBet structuré
// =============================================================================

/**
 * Devine le nombre de sélections d'un combiné selon sa cote totale.
 * Heuristique simple : plus la cote est élevée, plus on a de sélections.
 */
function guessSelectionCount(odd: number): number {
  if (odd < 2.5) return 2;
  if (odd < 4) return 3;
  if (odd < 6) return 4;
  return 5;
}

/**
 * Génère N sélections dont le produit des cotes est ≈ cote totale visée.
 * On mixe foot/tennis si possible pour refléter le mix réel d'AJ Pronos.
 */
function generateSelections(
  rand: () => number,
  count: number,
  targetOdd: number,
  primarySport: Sport,
  comboResult: 'win' | 'loss',
  matchDate: Date,
): ComboBetSelection[] {
  // Distribution : si combo perdu, on choisit aléatoirement quelles sélections
  // sont perdantes. Si combo gagné, toutes les sélections sont gagnantes.
  const losingIndices = new Set<number>();
  if (comboResult === 'loss') {
    const nbLosses = 1 + Math.floor(rand() * Math.min(count - 1, 2));
    while (losingIndices.size < nbLosses) {
      losingIndices.add(Math.floor(rand() * count));
    }
  }

  // Cible par sélection ≈ racine n-ième de la cote totale
  const targetPerSel = Math.pow(targetOdd, 1 / count);

  return Array.from({ length: count }, (_, i) => {
    // Mix sport : 80% chance d'avoir le primarySport, 20% l'autre
    const sport: Sport =
      rand() < 0.8
        ? primarySport
        : primarySport === 'foot'
          ? 'tennis'
          : 'foot';

    const pool = sport === 'foot' ? FOOT_TEMPLATES : TENNIS_TEMPLATES;
    const template = pool[Math.floor(rand() * pool.length)];

    // Ajuste la cote autour de la cible (± 30%)
    const oddVariation = 0.7 + rand() * 0.6;
    const odd = Math.round(targetPerSel * oddVariation * 100) / 100;

    const selResult: PronoResult = losingIndices.has(i) ? 'loss' : 'win';

    // Match dans la matinée/après-midi du jour, avec un peu de variation
    const matchStart = new Date(matchDate);
    matchStart.setHours(16 + Math.floor(rand() * 6), 0, 0, 0);

    // ID stable pour la sélection (utilisé par makeFootballStats / makeTennisStats
    // comme seed PRNG, garantit des stats déterministes entre rebuilds).
    const selectionId = `${template.teamHome}-${template.teamAway}-${i}`;

    const baseSelection: ComboBetSelection = {
      sport,
      competition: template.competition,
      teamHome: template.teamHome,
      teamAway: template.teamAway,
      teamHomeLogo: getCompetitorLogo(template.teamHome, sport),
      teamAwayLogo: getCompetitorLogo(template.teamAway, sport),
      matchStartAt: matchStart.toISOString(),
      prediction: template.prediction,
      odd,
      miniReasoning: `Analyse rapide : ${template.teamHome} vs ${template.teamAway}, ${template.prediction.toLowerCase()} sur ${template.competition}.`,
      result: selResult,
      finalScore:
        selResult === 'win'
          ? `${template.teamHome} 2-1 ${template.teamAway}`
          : selResult === 'loss'
            ? `${template.teamHome} 0-2 ${template.teamAway}`
            : undefined,
    };

    // Injection des stats Stats Center (selon le sport)
    if (sport === 'foot') {
      baseSelection.stats = makeFootballStats({
        ...baseSelection,
        type: 'single',
        id: selectionId,
        confidence: 3,
        reasoning: '',
        minTier: 'starter',
        publishedAt: baseSelection.matchStartAt,
      });
    } else {
      baseSelection.tennisStats = makeTennisStats({
        id: selectionId,
        teamHome: template.teamHome,
        teamAway: template.teamAway,
        competition: template.competition,
      });
    }

    return baseSelection;
  });
}

export function buildComboBetFixtures(): ComboBet[] {
  return RAW_COMBOS.map((raw) => {
    const rand = seedFrom(raw.id);
    const year = 2026;
    const month = FRENCH_MONTHS[raw.month];
    const day = parseInt(raw.day, 10);
    const date = new Date(year, month, day);
    const count = guessSelectionCount(raw.combinationOdd);

    const selections = generateSelections(
      rand,
      count,
      raw.combinationOdd,
      raw.primarySport,
      raw.result,
      date,
    );

    // Confiance fictive : cotes basses = confiance haute
    const confidence: ComboBet['confidence'] =
      raw.combinationOdd < 2.5
        ? 5
        : raw.combinationOdd < 3.5
          ? 4
          : raw.combinationOdd < 5
            ? 3
            : 2;

    // Tier : combinés à grosse cote (>5) souvent en VIP, sinon Pro
    const minTier: ComboBet['minTier'] =
      raw.combinationOdd > 5.5 ? 'vip' : raw.combinationOdd > 3.5 ? 'pro' : 'starter';

    return {
      type: 'combo',
      id: raw.id,
      selections,
      combinationOdd: raw.combinationOdd,
      confidence,
      reasoning: `Combiné ${count} sélections — stratégie ${raw.primarySport === 'foot' ? 'football' : 'tennis'}. Cote totale visée ${raw.combinationOdd.toFixed(2)}.`,
      minTier,
      publishedAt: date.toISOString(),
      result: raw.result,
    };
  });
}
