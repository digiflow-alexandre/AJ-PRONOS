/**
 * Fixtures RÉELLES des paris de mai 2026 — extraites depuis les tickets
 * Winamax du dossier PARIS MAI/. Chaque entrée est un combiné posé par
 * Julien, avec ses vraies sélections, cotes individuelles et résultat.
 *
 * Source : 29 tickets Winamax, 24 gagnés / 5 perdus, ROI ~72.2%.
 *
 * Généré le 2026-06-05 — à remplacer quand on aura un vrai backend de
 * publication des combinés par Julien.
 */

import type { ComboBet, ComboBetSelection } from '@/types/prono';

import { getCompetitorLogo } from './team-logos';

function sel(
  sport: ComboBetSelection['sport'],
  competition: string,
  teamHome: string,
  teamAway: string,
  matchStartAt: string,
  prediction: string,
  odd: number,
  miniReasoning: string,
  result: ComboBetSelection['result'],
): ComboBetSelection {
  return {
    sport,
    competition,
    teamHome,
    teamAway,
    teamHomeLogo: getCompetitorLogo(teamHome, sport) ?? undefined,
    teamAwayLogo: getCompetitorLogo(teamAway, sport) ?? undefined,
    matchStartAt,
    prediction,
    odd,
    miniReasoning,
    result,
  };
}

export const MAI_2026_REAL_COMBOS: ComboBet[] = [
  // ===== mai-2026-01-a (2026-05-01, mise 10€, cote 2.35, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-01-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'H. Heliovaara / H. Patten', 'L. Johnson / J. Zielinski', '2026-05-01T19:00:00.000Z', 'H. Heliovaara / H. Patten', 1.0, 'Vainqueur — cote 1.0', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'L. Siegemund / V. Zvonareva', 'M. Andreeva / D. Shnaider', '2026-05-01T19:00:00.000Z', 'M. Andreeva / D. Shnaider', 1.06, 'Vainqueur — cote 1.06', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'G. Andreozzi / M. Guinard', 'M. Gonzalez / A. Molteni', '2026-05-01T19:00:00.000Z', 'G. Andreozzi / M. Guinard', 1.39, 'Vainqueur — cote 1.39', 'win'),
      sel('foot', 'Serie A', 'Spezia', 'Venise', '2026-05-01T19:00:00.000Z', 'Venise ou match nul', 1.14, 'Double chance — cote 1.14', 'win'),
      sel('foot', 'Serie A', 'Palerme', 'Catanzaro', '2026-05-01T19:00:00.000Z', 'Palerme ou nul & +0.5', 1.27, 'MyMatch — cote 1.27', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'J. Sinner', 'A. Fils', '2026-05-01T19:00:00.000Z', 'Plus de 17.5', 1.1, 'Nombre de jeux — cote 1.1', 'win'),
    ],
    combinationOdd: 2.35,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 10€, gain 23.6€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-01T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-01-b (2026-05-01, mise 5€, cote 1.68, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-01-b',
    selections: [
      sel('foot', 'La Liga', 'Osasuna', 'FC Barcelone', '2026-05-02T19:00:00.000Z', 'FC Barcelone', 1.68, 'Résultat — cote 1.68', 'win'),
    ],
    combinationOdd: 1.68,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 5€, gain 8.4€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-01T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-01-c (2026-05-01, mise 13.6€, cote 2.53, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-01-c',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Blockx', 'A. Zverev', '2026-05-01T19:00:00.000Z', 'Plus de 18.5', 1.15, 'Nombre de jeux — cote 1.15', 'win'),
      sel('foot', 'Serie A', 'Pisa', 'Lecce', '2026-05-01T19:00:00.000Z', 'Lecce', 2.2, 'Résultat — cote 2.2', 'win'),
    ],
    combinationOdd: 2.53,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 13.6€, gain 34.41€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-01T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-03 (2026-05-03, mise 8.4€, cote 7.96, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-03',
    selections: [
      sel('foot', 'Ligue 1', 'Lille', 'Le Havre', '2026-05-03T19:00:00.000Z', 'Match nul', 3.3, 'Résultat — cote 3.3', 'win'),
      sel('foot', 'Ligue 1', 'Paris FC', 'Brest', '2026-05-03T19:00:00.000Z', 'Paris FC', 1.06, 'Résultat — cote 1.06', 'win'),
      sel('foot', 'Ligue 1', 'Auxerre', 'Angers', '2026-05-03T19:00:00.000Z', 'Auxerre', 1.11, 'Résultat — cote 1.11', 'win'),
      sel('foot', 'Ligue 1', 'Lyon', 'Rennes', '2026-05-03T19:00:00.000Z', 'Lyon', 2.05, 'Résultat — cote 2.05', 'win'),
    ],
    combinationOdd: 7.96,
    confidence: 1,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 8.4€, gain 67.15€. Stratégie tennis/foot équilibrée.',
    minTier: 'vip',
    publishedAt: '2026-05-03T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-05 (2026-05-05, mise 25€, cote 2.21, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-05',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'D. Mérida', 'M.T. Barrios-Vera', '2026-05-05T19:00:00.000Z', 'D. Mérida', 1.47, 'Vainqueur — cote 1.47', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'A. Potapova', 'N. Bartunkova', '2026-05-05T19:00:00.000Z', 'A. Potapova', 1.34, 'Vainqueur — cote 1.34', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'Z. Sonmez', 'J. Ruggeri', '2026-05-05T19:00:00.000Z', 'Z. Sonmez', 1.12, 'Vainqueur — cote 1.12', 'win'),
    ],
    combinationOdd: 2.21,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 55.3€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-05T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-07 (2026-05-07, mise 25€, cote 2.19, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-07',
    selections: [
      sel('foot', 'Conference League', 'Crystal Palace', 'Shakhtar Donetsk', '2026-05-07T19:00:00.000Z', 'Crystal Palace ou nul', 1.16, 'Double chance — cote 1.16', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'A. Sabalenka', 'B. Krejcikova', '2026-05-07T19:00:00.000Z', '2-0', 1.15, 'Score exact — cote 1.15', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'N. Borges', 'R. Jodar', '2026-05-08T19:00:00.000Z', 'R. Jodar', 1.26, 'Vainqueur — cote 1.26', 'win'),
      sel('foot', 'Premier League', 'Manchester City', 'Brentford', '2026-05-09T19:00:00.000Z', 'Manchester City', 1.3, 'Résultat — cote 1.3', 'win'),
    ],
    combinationOdd: 2.19,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 54.93€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-07T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-08 (2026-05-08, mise 25€, cote 2.02, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-08',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'T.C. Grant', 'V. Mboko', '2026-05-08T19:00:00.000Z', 'V. Mboko', 1.0, 'Vainqueur — cote 1.0', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'T. Griekspoor', 'A. Blockx', '2026-05-08T19:00:00.000Z', 'A. Blockx', 1.45, 'Vainqueur — cote 1.45', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'S. Waltert', 'H. Baptiste', '2026-05-08T19:00:00.000Z', 'H. Baptiste', 1.39, 'Vainqueur — cote 1.39', 'win'),
    ],
    combinationOdd: 2.02,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 50.39€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-08T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-10 (2026-05-10, mise 25€, cote 1.67, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-10',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Eala', 'E. Rybakina', '2026-05-10T19:00:00.000Z', '0-2', 1.1, 'Score exact — cote 1.1', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'E. Cocciaretto', 'I. Swiatek', '2026-05-10T19:00:00.000Z', 'I. Swiatek', 1.11, 'Vainqueur — cote 1.11', 'win'),
      sel('foot', 'Ligue 1', 'Paris SG', 'Brest', '2026-05-10T19:00:00.000Z', 'PSG', 1.16, 'Résultat — cote 1.16', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'E. Svitolina', 'N. Bartunkova', '2026-05-11T19:00:00.000Z', 'E. Svitolina', 1.18, 'Vainqueur — cote 1.18', 'win'),
    ],
    combinationOdd: 1.67,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 41.95€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-10T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-16 (2026-05-16, mise 25€, cote 3.86, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-16',
    selections: [
      sel('foot', 'Premier League', 'Chelsea', 'Manchester City', '2026-05-16T19:00:00.000Z', 'Manchester City', 1.68, 'Résultat — cote 1.68', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'C. Gauff', 'E. Svitolina', '2026-05-16T19:00:00.000Z', 'E. Svitolina', 2.3, 'Vainqueur — cote 2.3', 'win'),
    ],
    combinationOdd: 3.86,
    confidence: 2,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 96.6€. Stratégie tennis/foot équilibrée.',
    minTier: 'pro',
    publishedAt: '2026-05-16T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-17 (2026-05-17, mise 22.19€, cote 1.64, LOSS) =====
  {
    type: 'combo',
    id: 'mai-2026-17',
    selections: [
      sel('foot', 'Ligue 1', 'Nantes', 'Toulouse', '2026-05-17T19:00:00.000Z', 'Toulouse ou nul', 1.0, 'Double chance — cote 1.0', 'loss'),
      sel('foot', 'Ligue 1', 'Lyon', 'Lens', '2026-05-17T19:00:00.000Z', 'Lyon', 1.64, 'Résultat — cote 1.64', 'loss'),
    ],
    combinationOdd: 1.64,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 22.19€ perdue. Une sélection a fait basculer. Transparence totale.',
    minTier: 'starter',
    publishedAt: '2026-05-17T10:00:00.000Z',
    result: 'loss',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-19 (2026-05-19, mise 25€, cote 2.24, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-19',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'Y. Hanfmann', 'M. Schoenhaus', '2026-05-18T19:00:00.000Z', 'Y. Hanfmann', 1.19, 'Vainqueur — cote 1.19', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'J. McCabe', 'Z. Kolar', '2026-05-19T19:00:00.000Z', 'Z. Kolar', 1.13, 'Vainqueur — cote 1.13', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'L. Darderi', 'R.A. Burruchaga', '2026-05-19T19:00:00.000Z', 'L. Darderi', 1.46, 'Vainqueur — cote 1.46', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'J. Brooksby', 'C. Ruud', '2026-05-19T19:00:00.000Z', 'C. Ruud', 1.14, 'Vainqueur — cote 1.14', 'win'),
    ],
    combinationOdd: 2.24,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 56.26€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-19T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-20 (2026-05-20, mise 25€, cote 2.08, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-20',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Davidovich-Fokina', 'A. De Minaur', '2026-05-20T19:00:00.000Z', 'A. De Minaur', 1.6, 'Vainqueur — cote 1.6', 'win'),
      sel('foot', 'Europa League', 'Fribourg', 'Aston Villa', '2026-05-20T19:00:00.000Z', 'Aston Villa', 1.3, 'Vainqueur de la finale — cote 1.3', 'win'),
    ],
    combinationOdd: 2.08,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 52.0€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-20T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-21-a (2026-05-21, mise 19.08€, cote 1.32, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-21-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Kovacevic', 'C. Ugo Carabelli', '2026-05-21T19:00:00.000Z', 'A. Kovacevic', 1.32, 'Vainqueur — cote 1.32', 'win'),
    ],
    combinationOdd: 1.32,
    confidence: 5,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 19.08€, gain 25.19€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-21T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-21-b (2026-05-21, mise 19.42€, cote 1.5, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-21-b',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Kalinina', 'A. Bondar', '2026-05-21T19:00:00.000Z', 'A. Kalinina', 1.28, 'Vainqueur — cote 1.28', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'V. Mboko', 'L.A. Fernandez', '2026-05-21T19:00:00.000Z', 'V. Mboko - Oui', 1.17, 'Au moins un set — cote 1.17', 'win'),
    ],
    combinationOdd: 1.5,
    confidence: 5,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 19.42€, gain 29.08€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-21T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-21-c (2026-05-21, mise 11€, cote 2.33, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-21-c',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'E. Butvilas', 'A. Bublik', '2026-05-20T19:00:00.000Z', 'A. Bublik', 1.33, 'Vainqueur — cote 1.33', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'L. Darderi', 'Y. Hanfmann', '2026-05-20T19:00:00.000Z', 'L. Darderi - Oui', 1.16, 'Au moins un set — cote 1.16', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'S. Kraus', 'A-L. Friedsam', '2026-05-21T19:00:00.000Z', 'S. Kraus', 1.2, 'Vainqueur — cote 1.2', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'A. Popyrin', 'C. Ruud', '2026-05-21T19:00:00.000Z', 'C. Ruud', 1.26, 'Vainqueur — cote 1.26', 'win'),
    ],
    combinationOdd: 2.33,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 11€, gain 25.81€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-21T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-22-a (2026-05-22, mise 23.67€, cote 1.47, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-22-a',
    selections: [
      sel('foot', 'Ligue 1', 'Lens', 'Nice', '2026-05-22T19:00:00.000Z', 'Lens', 1.47, 'Résultat — cote 1.47', 'win'),
    ],
    combinationOdd: 1.47,
    confidence: 5,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 23.67€, gain 34.79€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-22T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-22-b (2026-05-22, mise 24.03€, cote 1.61, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-22-b',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'L. Tien', 'A. Bublik', '2026-05-22T19:00:00.000Z', 'A. Bublik - Oui', 1.21, 'Au moins un set — cote 1.21', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'V. Mboko', 'J. Cristian', '2026-05-22T19:00:00.000Z', 'V. Mboko', 1.33, 'Vainqueur — cote 1.33', 'win'),
    ],
    combinationOdd: 1.61,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 24.03€, gain 38.67€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-22T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-22-c (2026-05-22, mise 10€, cote 2.0, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-22-c',
    selections: [
      sel('foot', 'Ligue 1', 'Lens', 'Nice', '2026-05-22T19:00:00.000Z', 'Lens gagne', 2.0, 'Grosse cote boostée — cote 2.0', 'win'),
    ],
    combinationOdd: 2.0,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 10€, gain 20.0€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-22T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-23-a (2026-05-23, mise 24.79€, cote 2.1, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-23-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'V. Mboko', 'E. Navarro', '2026-05-23T19:00:00.000Z', 'V. Mboko - Oui', 1.16, 'Au moins un set — cote 1.16', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'A. Kalinina', 'P. Marcinko', '2026-05-23T19:00:00.000Z', 'Plus de 7.5', 1.1, '1er set jeux — cote 1.1', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'I. Buse', 'T. Paul', '2026-05-23T19:00:00.000Z', 'I. Buse - Oui', 1.42, 'Au moins un set — cote 1.42', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'M. Navone', 'L. Tien', '2026-05-23T19:00:00.000Z', 'M. Navone - Oui', 1.16, 'Au moins un set — cote 1.16', 'win'),
    ],
    combinationOdd: 2.1,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 24.79€, gain 52.37€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-23T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-23-b (2026-05-23, mise 25€, cote 2.24, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-23-b',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Davidovich-Fokina', 'D. Dzumhur', '2026-05-24T19:00:00.000Z', 'A. Davidovich-Fokina', 1.14, 'Vainqueur — cote 1.14', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'K. Efremova', 'S. Cirstea', '2026-05-24T19:00:00.000Z', '0-2', 1.12, 'Score exact — cote 1.12', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'E. Svitolina', 'A. Bondar', '2026-05-25T19:00:00.000Z', 'E. Svitolina', 1.14, 'Vainqueur — cote 1.14', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'C. Gauff', 'T. Townsend', '2026-05-26T19:00:00.000Z', 'C. Gauff', 1.11, 'Vainqueur — cote 1.11', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'V. Mboko', 'N. Bartunkova', '2026-05-26T19:00:00.000Z', 'V. Mboko', 1.26, 'Vainqueur — cote 1.26', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'J. Sinner', 'C. Tabur', '2026-05-26T19:00:00.000Z', '3-0', 1.1, 'Score exact — cote 1.1', 'win'),
    ],
    combinationOdd: 2.24,
    confidence: 3,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 56.91€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-23T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-24 (2026-05-24, mise 10€, cote 3.52, LOSS) =====
  {
    type: 'combo',
    id: 'mai-2026-24',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'H. Medjedovic', 'Y. Hanfmann', '2026-05-24T19:00:00.000Z', 'H. Medjedovic', 1.54, 'Vainqueur — cote 1.54', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'T. Fritz', 'N. Basavareddy', '2026-05-24T19:00:00.000Z', 'N. Basavareddy', 1.1, 'Vainqueur — cote 1.1', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'H. Dellien', 'V. Royer', '2026-05-24T19:00:00.000Z', 'H. Dellien', 1.66, 'Vainqueur — cote 1.66', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'G. Mpetshi Perricard', 'N. Djokovic', '2026-05-24T19:00:00.000Z', 'N. Djokovic', 1.25, 'Vainqueur — cote 1.25', 'loss'),
    ],
    combinationOdd: 3.52,
    confidence: 2,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 10€ perdue. Une sélection a fait basculer. Transparence totale.',
    minTier: 'pro',
    publishedAt: '2026-05-24T10:00:00.000Z',
    result: 'loss',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-25-a (2026-05-25, mise 25€, cote 2.16, LOSS) =====
  {
    type: 'combo',
    id: 'mai-2026-25-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'P. Carreno-Busta', 'J. Lehecka', '2026-05-25T19:00:00.000Z', 'J. Lehecka', 1.24, 'Vainqueur — cote 1.24', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'A. Rinderknech', 'J. Rodionov', '2026-05-25T19:00:00.000Z', 'A. Rinderknech', 1.34, 'Vainqueur — cote 1.34', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'C. Ruud', 'R. Safiullin', '2026-05-25T19:00:00.000Z', 'C. Ruud', 1.12, 'Vainqueur — cote 1.12', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'F. Cerundolo', 'B. Van De Zandschulp', '2026-05-25T19:00:00.000Z', 'F. Cerundolo', 1.16, 'Vainqueur — cote 1.16', 'loss'),
    ],
    combinationOdd: 2.16,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€ perdue. Une sélection a fait basculer. Transparence totale.',
    minTier: 'starter',
    publishedAt: '2026-05-25T10:00:00.000Z',
    result: 'loss',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-25-b (2026-05-25, mise 25€, cote 2.16, LOSS) =====
  {
    type: 'combo',
    id: 'mai-2026-25-b',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'P. Carreno-Busta', 'J. Lehecka', '2026-05-25T19:00:00.000Z', 'J. Lehecka', 1.24, 'Vainqueur — cote 1.24', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'A. Rinderknech', 'J. Rodionov', '2026-05-25T19:00:00.000Z', 'A. Rinderknech', 1.34, 'Vainqueur — cote 1.34', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'C. Ruud', 'R. Safiullin', '2026-05-25T19:00:00.000Z', 'C. Ruud', 1.12, 'Vainqueur — cote 1.12', 'loss'),
      sel('tennis', 'ATP / WTA Tour', 'F. Cerundolo', 'B. Van De Zandschulp', '2026-05-25T19:00:00.000Z', 'F. Cerundolo', 1.16, 'Vainqueur — cote 1.16', 'loss'),
    ],
    combinationOdd: 2.16,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€ perdue. Une sélection a fait basculer. Transparence totale.',
    minTier: 'starter',
    publishedAt: '2026-05-25T10:00:00.000Z',
    result: 'loss',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-26 (2026-05-26, mise 25€, cote 2.07, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-26',
    selections: [
      sel('foot', 'Bundesliga', 'B. Munich', 'Stuttgart', '2026-05-23T19:00:00.000Z', 'B. Munich', 1.34, 'Résultat — cote 1.34', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'A. Davidovich-Fokina', 'D. Dzumhur', '2026-05-24T19:00:00.000Z', 'A. Davidovich-Fokina', 1.13, 'Vainqueur — cote 1.13', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'C. Ruud', 'R. Safiullin', '2026-05-25T19:00:00.000Z', 'C. Ruud', 1.1, 'Vainqueur — cote 1.1', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'T. Faurel', 'V. Vacherot', '2026-05-26T19:00:00.000Z', 'V. Vacherot', 1.13, 'Vainqueur — cote 1.13', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'J. Sinner', 'C. Tabur', '2026-05-26T19:00:00.000Z', '3-0', 1.1, 'Score exact — cote 1.1', 'win'),
    ],
    combinationOdd: 2.07,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 52.3€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-26T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-27-a (2026-05-27, mise 27€, cote 1.91, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-27-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'M. Kostyuk', 'K. Volynets', '2026-05-27T19:00:00.000Z', 'M. Kostyuk', 1.13, 'Vainqueur — cote 1.13', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'E. Lys', 'S. Cirstea', '2026-05-27T19:00:00.000Z', 'S. Cirstea', 1.2, 'Vainqueur — cote 1.2', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'C. Ruud', 'H. Medjedovic', '2026-05-27T19:00:00.000Z', 'C. Ruud', 1.41, 'Vainqueur — cote 1.41', 'win'),
    ],
    combinationOdd: 1.91,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 27€, gain 51.99€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-27T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-27-b (2026-05-27, mise 25€, cote 1.35, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-27-b',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'A. Davidovich-Fokina', 'T. Tirante', '2026-05-27T19:00:00.000Z', 'T. Tirante', 1.23, 'Vainqueur — cote 1.23', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'D. Snigur', 'P. Stearns', '2026-05-27T19:00:00.000Z', 'P. Stearns', 1.1, 'Vainqueur — cote 1.1', 'win'),
    ],
    combinationOdd: 1.35,
    confidence: 5,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 33.83€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-27T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-28 (2026-05-28, mise 25€, cote 1.95, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-28',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'M. Sakkari', 'C. Liu', '2026-05-28T19:00:00.000Z', 'M. Sakkari', 1.48, 'Vainqueur — cote 1.48', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'F. Auger-Aliassime', 'R.A. Burruchaga', '2026-05-28T19:00:00.000Z', 'F. Auger-Aliassime', 1.32, 'Vainqueur — cote 1.32', 'win'),
    ],
    combinationOdd: 1.95,
    confidence: 4,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 48.84€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-28T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-29-a (2026-05-29, mise 25€, cote 1.45, WIN) =====
  {
    type: 'combo',
    id: 'mai-2026-29-a',
    selections: [
      sel('tennis', 'ATP / WTA Tour', 'S. Sierra', 'S. Cirstea', '2026-05-29T19:00:00.000Z', 'S. Cirstea', 1.25, 'Vainqueur — cote 1.25', 'win'),
      sel('tennis', 'ATP / WTA Tour', 'E. Svitolina', 'T. Korpatsch', '2026-05-29T19:00:00.000Z', '2-0', 1.16, 'Score exact — cote 1.16', 'win'),
    ],
    combinationOdd: 1.45,
    confidence: 5,
    reasoning: 'Combiné posé en réel sur Winamax. Mise 25€, gain 36.25€. Stratégie tennis/foot équilibrée.',
    minTier: 'starter',
    publishedAt: '2026-05-29T10:00:00.000Z',
    result: 'win',
    bookmakerName: 'Winamax',
  },
  // ===== mai-2026-29-b (2026-05-29, mise 25€, cote 2.25, LOSS) =====
  {
    type: 'combo',
    id: 'mai-2026-29-b',
    selections: [
      sel('foot', 'Champions League', 'Paris SG', 'Arsenal', '2026-05-30T19:00:00.000Z', 'PSG', 2.25, 'Résultat — cote 2.25', 'loss'),
    ],
    combinationOdd: 2.25,
    confidence: 3,
    reasoning: 'Finale Champions League à la Puskás Aréna de Budapest, PSG contre Arsenal. Sur ce type de match unique, mon approche reste la même : chercher la value, pas la certitude. La cote PSG à 2.25 chez Winamax me paraît trop haute pour un favori statistique de la phase finale. Arsenal a un parcours solide mais une défense parfois fébrile en situation de pression maximale, et le PSG a montré sur les phases à élimination directe qu\'il sait élever son niveau quand l\'enjeu est là. Confiance moyenne : finale = match unique, où la mentale et un coup du sort comptent autant que le papier. Mais la value est là, et c\'est ce que je joue.',
    minTier: 'starter',
    publishedAt: '2026-05-29T10:00:00.000Z',
    result: 'loss',
    bookmakerName: 'Winamax',
  },
];
