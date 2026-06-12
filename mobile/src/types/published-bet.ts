/**
 * Types DB pour les pronos publiés par l'admin (Julien).
 * Snake_case côté DB, on les convertit en AnyBet (camelCase) pour le front
 * via convertToAnyBet().
 */

import type {
  AnyBet,
  ComboBet,
  ComboBetSelection,
  PronoResult,
  Prono,
  Sport,
} from './prono';
import type { SubscriptionTier } from './profile';

export type BetKind = 'single' | 'combo';

export type PublishedBetRow = {
  id: string;
  kind: BetKind;
  min_tier: Exclude<SubscriptionTier, 'trial'>;
  confidence: 1 | 2 | 3 | 4 | 5;
  reasoning: string;
  total_odd: number;
  bookmaker_screenshot_url: string | null;
  bookmaker_name: string | null;
  result: PronoResult;
  published_at: string;
  published_by: string;
  created_at: string;
  updated_at: string;
};

export type PublishedBetSelectionRow = {
  id: string;
  published_bet_id: string;
  position: number;
  sport: Sport;
  competition: string;
  team_home: string;
  team_away: string;
  team_home_logo: string | null;
  team_away_logo: string | null;
  match_start_at: string;
  prediction: string;
  odd: number;
  mini_reasoning: string;
  result: PronoResult;
  final_score: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Convertit une row DB + ses sélections en AnyBet (format consommé par
 * tous les composants UI existants : PronoCard, ComboBetCard, etc.).
 */
export function convertToAnyBet(
  bet: PublishedBetRow,
  selections: PublishedBetSelectionRow[],
): AnyBet {
  // Tri par position pour respecter l'ordre saisi par l'admin
  const sortedSelections = [...selections].sort(
    (a, b) => a.position - b.position,
  );

  // Garde : un "combo" avec une seule sélection = un single dans les faits.
  // On rebascule en single pour pas afficher "Combiné" trompeusement.
  const isEffectivelySingle =
    bet.kind === 'single' ||
    (bet.kind === 'combo' && sortedSelections.length === 1);

  if (isEffectivelySingle) {
    const s = sortedSelections[0];
    if (!s) {
      throw new Error(`Single bet ${bet.id} has no selection`);
    }
    const single: Prono = {
      type: 'single',
      id: bet.id,
      sport: s.sport,
      competition: s.competition,
      teamHome: s.team_home,
      teamAway: s.team_away,
      teamHomeLogo: s.team_home_logo ?? undefined,
      teamAwayLogo: s.team_away_logo ?? undefined,
      matchStartAt: s.match_start_at,
      prediction: s.prediction,
      odd: s.odd,
      confidence: bet.confidence,
      reasoning: bet.reasoning,
      minTier: bet.min_tier,
      publishedAt: bet.published_at,
      updatedAt: bet.updated_at,
      result: bet.result,
      finalScore: s.final_score ?? undefined,
      bookmakerScreenshotUrl: bet.bookmaker_screenshot_url ?? undefined,
      bookmakerName: bet.bookmaker_name ?? undefined,
    };
    return single;
  }

  // Combo
  const comboSelections: ComboBetSelection[] = sortedSelections.map((s) => ({
    sport: s.sport,
    competition: s.competition,
    teamHome: s.team_home,
    teamAway: s.team_away,
    teamHomeLogo: s.team_home_logo ?? undefined,
    teamAwayLogo: s.team_away_logo ?? undefined,
    matchStartAt: s.match_start_at,
    prediction: s.prediction,
    odd: s.odd,
    miniReasoning: s.mini_reasoning,
    result: s.result,
    finalScore: s.final_score ?? undefined,
  }));

  const combo: ComboBet = {
    type: 'combo',
    id: bet.id,
    selections: comboSelections,
    combinationOdd: bet.total_odd,
    confidence: bet.confidence,
    reasoning: bet.reasoning,
    minTier: bet.min_tier,
    publishedAt: bet.published_at,
    updatedAt: bet.updated_at,
    result: bet.result,
    bookmakerScreenshotUrl: bet.bookmaker_screenshot_url ?? undefined,
    bookmakerName: bet.bookmaker_name ?? undefined,
  };
  return combo;
}

/**
 * Calcule la cote totale d'un combiné (produit des cotes des sélections).
 * Pour un single, c'est juste odd[0].
 */
export function computeTotalOdd(selectionOdds: number[]): number {
  if (selectionOdds.length === 0) return 1;
  return (
    Math.round(
      selectionOdds.reduce((acc, o) => acc * o, 1) * 100,
    ) / 100
  );
}
