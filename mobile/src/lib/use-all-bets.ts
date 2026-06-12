import { useMemo } from 'react';

import type { AnyBet, ComboBet, Prono } from '@/types/prono';

import { ALL_BETS } from './fixtures';
import { useLogoEnrichment } from './use-logo-enrichment';
import { usePublishedBets } from './use-published-bets';

/**
 * Combo à 1 seule sélection = single dans les faits (cote totale = cote
 * de la sélection unique). On le rebascule en Prono pour pas afficher
 * un badge "Combiné" trompeur dans la UI. — Alex 2026-06-05.
 */
function flattenSoloCombo(bet: AnyBet): AnyBet {
  if (bet.type !== 'combo') return bet;
  if (bet.selections.length !== 1) return bet;
  const s = (bet as ComboBet).selections[0];
  const flat: Prono = {
    type: 'single',
    id: bet.id,
    sport: s.sport,
    competition: s.competition,
    teamHome: s.teamHome,
    teamAway: s.teamAway,
    teamHomeLogo: s.teamHomeLogo,
    teamAwayLogo: s.teamAwayLogo,
    matchStartAt: s.matchStartAt,
    prediction: s.prediction,
    odd: s.odd,
    confidence: bet.confidence,
    reasoning: bet.reasoning,
    minTier: bet.minTier,
    publishedAt: bet.publishedAt,
    result: bet.result ?? s.result,
    finalScore: s.finalScore,
    bookmakerScreenshotUrl: bet.bookmakerScreenshotUrl,
    bookmakerName: bet.bookmakerName,
  };
  return flat;
}

/**
 * Source unique de vérité côté UI pour tous les pronos visibles dans l'app.
 *
 * Combine :
 * - Les pronos publiés en DB par Julien via l'admin app (priorité haute,
 *   triés du plus récent au plus ancien)
 * - Les fixtures historiques (mai 2026 + combinés jan-avril)
 *
 * Les fixtures restent en V1 pour avoir un fond de pronos historiques
 * sur lequel on peut calculer le bilan 7j, l'historique, les stats par
 * mois. Quand on aura suffisamment de vrais pronos en DB (~1-2 mois après
 * lancement), on pourra retirer les fixtures.
 */
export function useAllBets(): {
  bets: AnyBet[];
  publishedFromDB: AnyBet[];
  fixtures: AnyBet[];
  isLoading: boolean;
} {
  const { bets: publishedBets, isLoading } = usePublishedBets();

  const combined = useMemo<AnyBet[]>(
    () => [...publishedBets, ...ALL_BETS].map(flattenSoloCombo),
    [publishedBets],
  );

  // Enrichit les logos manquants depuis team_stats (1 query globale).
  // Toutes les listes en profitent : pronos, carnet, stats, accueil.
  const enriched = useLogoEnrichment(combined);

  return {
    bets: enriched,
    publishedFromDB: publishedBets.map(flattenSoloCombo),
    fixtures: ALL_BETS.map(flattenSoloCombo),
    isLoading,
  };
}
