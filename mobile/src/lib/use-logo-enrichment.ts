import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import { teamMatches } from './team-name-matching';
import type {
  AnyBet,
  ComboBet,
  ComboBetSelection,
  Prono,
} from '@/types/prono';

type LogoLookup = { team_name: string; team_logo: string | null };

/**
 * Enrichit en batch les logos manquants de tous les paris en lookant up
 * dans team_stats. Une seule query SQL globale au montage, puis matching
 * local par nom d'équipe (tolérant via teamMatches).
 *
 * Utilisé au niveau useAllBets pour que TOUTES les listes (Pronos, Carnet,
 * Stats, Accueil) bénéficient automatiquement des logos remontés via
 * API-Football pour les paris saisis à la main sans logo.
 */
export function useLogoEnrichment(bets: AnyBet[]): AnyBet[] {
  const [logoIndex, setLogoIndex] = useState<LogoLookup[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      // Source 1 : team_stats (classements des ligues trackées)
      // Source 2 : matches (matchs récupérés par fetch-matches — couvre
      //           les amicaux, équipes nationales exotiques, etc.)
      const [{ data: statsRows }, { data: matchRows }] = await Promise.all([
        supabase
          .from('team_stats')
          .select('team_name, team_logo')
          .not('team_logo', 'is', null),
        supabase
          .from('matches')
          .select('team_home, team_home_logo, team_away, team_away_logo')
          .or('team_home_logo.not.is.null,team_away_logo.not.is.null'),
      ]);
      if (ac.signal.aborted) return;

      const seen = new Set<string>();
      const unique: LogoLookup[] = [];

      // Fusionne les 2 sources
      for (const row of (statsRows ?? []) as LogoLookup[]) {
        if (seen.has(row.team_name)) continue;
        seen.add(row.team_name);
        unique.push(row);
      }
      for (const row of (matchRows ?? []) as {
        team_home: string;
        team_home_logo: string | null;
        team_away: string;
        team_away_logo: string | null;
      }[]) {
        if (row.team_home && row.team_home_logo && !seen.has(row.team_home)) {
          seen.add(row.team_home);
          unique.push({
            team_name: row.team_home,
            team_logo: row.team_home_logo,
          });
        }
        if (row.team_away && row.team_away_logo && !seen.has(row.team_away)) {
          seen.add(row.team_away);
          unique.push({
            team_name: row.team_away,
            team_logo: row.team_away_logo,
          });
        }
      }
      setLogoIndex(unique);
    })();
    return () => {
      ac.abort();
    };
  }, []);

  if (logoIndex.length === 0) return bets;

  const findLogo = (teamName: string): string | undefined => {
    const hit = logoIndex.find((r) => teamMatches(r.team_name, teamName));
    return hit?.team_logo ?? undefined;
  };

  return bets.map((bet) => {
    if (bet.type === 'single') {
      const p = bet as Prono;
      if (p.teamHomeLogo && p.teamAwayLogo) return bet;
      return {
        ...p,
        teamHomeLogo: p.teamHomeLogo ?? findLogo(p.teamHome),
        teamAwayLogo: p.teamAwayLogo ?? findLogo(p.teamAway),
      };
    }
    // Combo : enrichit chaque sélection
    const c = bet as ComboBet;
    const needsEnrich = c.selections.some(
      (s) => !s.teamHomeLogo || !s.teamAwayLogo,
    );
    if (!needsEnrich) return bet;
    const enrichedSelections: ComboBetSelection[] = c.selections.map((s) => ({
      ...s,
      teamHomeLogo: s.teamHomeLogo ?? findLogo(s.teamHome),
      teamAwayLogo: s.teamAwayLogo ?? findLogo(s.teamAway),
    }));
    return { ...c, selections: enrichedSelections };
  });
}
