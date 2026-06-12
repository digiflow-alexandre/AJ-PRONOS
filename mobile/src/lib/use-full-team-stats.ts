import { useEffect, useState } from 'react';

import { FOOT_COMPETITIONS } from '@/constants/competitions';
import { supabase } from './supabase';
import { teamMatches } from './team-name-matching';
import type {
  ProNoStats,
  RecentMatch,
  SeasonStats,
  StandingRow,
} from '@/types/stats';

/**
 * Hook complet pour le Stats Center : récupère stats détaillées + 10
 * derniers matchs + H2H pour 2 équipes. Trigger automatiquement les
 * Edge Functions enrich-team-details et fetch-h2h si les données ne
 * sont pas en cache (ou plus de 24h).
 *
 * Renvoie `null` tant que le 1er fetch n'est pas fini.
 */

type TeamLookup = {
  api_team_id: number;
  api_league_id: number;
  season: number | null;
  team_name: string;
  team_logo: string | null;
  form: string | null;
  standing_rank: number | null;
  played: number | null;
  wins: number | null;
  draws: number | null;
  losses: number | null;
  goals_for: number | null;
  goals_against: number | null;
  possession_pct: number | null;
  shots_per_match: number | null;
  shots_on_target_per_match: number | null;
  corners_per_match: number | null;
  free_kicks_per_match: number | null;
  chances_per_match: number | null;
  clean_sheets: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  updated_at: string;
};

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.`;
}

function toRecentMatch(
  r: {
    match_date: string;
    opponent_name: string;
    opponent_logo: string | null;
    is_home: boolean;
    score_for: number;
    score_against: number;
    result: 'V' | 'N' | 'D';
  },
): RecentMatch {
  return {
    date: formatShortDate(r.match_date),
    opponent: r.opponent_name,
    opponentLogo: r.opponent_logo ?? undefined,
    scoreHome: r.is_home ? r.score_for : r.score_against,
    scoreAway: r.is_home ? r.score_against : r.score_for,
    isHome: r.is_home,
    result: r.result,
  };
}

async function callEdgeFunction(
  name: string,
  body: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.functions.invoke(name, { body });
  } catch {
    // silencieux : si l'enrichissement plante, on affichera ce qu'on a
  }
}

export function useFullTeamStats(
  competitionLabel: string | undefined,
  teamHome: string | undefined,
  teamAway: string | undefined,
  sport: 'foot' | 'tennis' | undefined,
): { stats: ProNoStats | null; isLoading: boolean } {
  const [stats, setStats] = useState<ProNoStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sport !== 'foot' || !competitionLabel || !teamHome || !teamAway) {
      setStats(null);
      setIsLoading(false);
      return;
    }
    const ac = new AbortController();
    (async () => {
      setIsLoading(true);
      const baseLabel = competitionLabel.split('·')[0].trim();
      const comp = FOOT_COMPETITIONS.find(
        (c) => c.label.toLowerCase() === baseLabel.toLowerCase(),
      );
      if (!comp?.apiLeagueId) {
        setStats(null);
        setIsLoading(false);
        return;
      }
      const competitionLeagueId = comp.apiLeagueId;

      // 1. Lookup les 2 équipes — on cherche dans TOUTES les ligues, pas
      //    juste celle du pari. Raison : un pari "Lille vs Lyon" en Coupe
      //    de France (ligue 66, pas de standings) doit quand même remonter
      //    les stats de Lille et Lyon depuis leur ligue domestique (61).
      //    Idem pour les compétitions UEFA / internationales.
      const { data: rows } = await supabase
        .from('team_stats')
        .select('*')
        .order('season', { ascending: false });
      if (ac.signal.aborted) return;
      // rows trié par season DESC → find() prend la ligne la plus récente
      const teams = (rows ?? []) as TeamLookup[];

      // Détection compétition féminine : API-Football suffixe les équipes
      // nationales féminines avec "W" / "Women" (Germany W, Norway W).
      const isFeminine = /\b(féminin|feminin|women|wsl|nwsl|frauen|\(f\))\b/i.test(
        competitionLabel,
      );
      const findTeam = (query: string) => {
        if (isFeminine) {
          const withW = teams.find(
            (r) =>
              teamMatches(r.team_name.replace(/\s+(W|Women)\b/i, ''), query) &&
              /\s+(W|Women)\b/i.test(r.team_name),
          );
          if (withW) return withW;
        }
        return teams.find((r) => teamMatches(r.team_name, query));
      };
      const home = findTeam(teamHome);
      const away = findTeam(teamAway);
      if (!home || !away) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      // Ligue + saison contextuelles pour les stats détaillées : on utilise
      // celle où on a trouvé chaque équipe (= sa ligue domestique).
      const homeLeagueId = home.api_league_id;
      const awayLeagueId = away.api_league_id;
      const season = home.season ?? 2026;
      const apiLeagueId = competitionLeagueId ?? homeLeagueId;

      // 2. Trigger lazy enrichment si les détails saison sont vides
      const homeNeedsEnrichment = home.clean_sheets === null;
      const awayNeedsEnrichment = away.clean_sheets === null;
      const enrichPromises: Promise<void>[] = [];
      if (homeNeedsEnrichment) {
        enrichPromises.push(
          callEdgeFunction('enrich-team-details', {
            team_id: home.api_team_id,
            league_id: homeLeagueId,
            season,
          }),
        );
      }
      if (awayNeedsEnrichment) {
        enrichPromises.push(
          callEdgeFunction('enrich-team-details', {
            team_id: away.api_team_id,
            league_id: awayLeagueId,
            season,
          }),
        );
      }
      // 3. H2H : trigger fetch (la fonction gère son propre cache 24h)
      enrichPromises.push(
        callEdgeFunction('fetch-h2h', {
          home_id: home.api_team_id,
          away_id: away.api_team_id,
          last: 10,
        }),
      );
      await Promise.all(enrichPromises);
      if (ac.signal.aborted) return;

      // 4. Re-fetch les data enrichies (recent matches + h2h + standings)
      const lowId = Math.min(home.api_team_id, away.api_team_id);
      const highId = Math.max(home.api_team_id, away.api_team_id);
      const [
        { data: enrichedRows },
        { data: homeRecent },
        { data: awayRecent },
        { data: h2hRows },
      ] = await Promise.all([
        supabase
          .from('team_stats')
          .select('*')
          .eq('api_league_id', apiLeagueId)
          .order('season', { ascending: false }),
        supabase
          .from('team_recent_matches')
          .select(
            'match_date, opponent_name, opponent_logo, is_home, score_for, score_against, result',
          )
          .eq('api_team_id', home.api_team_id)
          .order('match_date', { ascending: false })
          .limit(10),
        supabase
          .from('team_recent_matches')
          .select(
            'match_date, opponent_name, opponent_logo, is_home, score_for, score_against, result',
          )
          .eq('api_team_id', away.api_team_id)
          .order('match_date', { ascending: false })
          .limit(10),
        supabase
          .from('team_head_to_head')
          .select(
            'match_date, score_low, score_high, team_low_id, team_high_id, competition',
          )
          .eq('team_low_id', lowId)
          .eq('team_high_id', highId)
          .order('match_date', { ascending: false })
          .limit(10),
      ]);
      if (ac.signal.aborted) return;

      const enrichedTeams = (enrichedRows ?? []) as TeamLookup[];
      const homeRefreshed =
        enrichedTeams.find((r) => r.api_team_id === home.api_team_id) ?? home;
      const awayRefreshed =
        enrichedTeams.find((r) => r.api_team_id === away.api_team_id) ?? away;

      // Build SeasonStats à partir des colonnes étendues
      const buildSeasonStats = (t: TeamLookup): SeasonStats => {
        const played = t.played ?? 0;
        const goalsForPerMatch =
          played > 0 ? (t.goals_for ?? 0) / played : 0;
        const goalsAgainstPerMatch =
          played > 0 ? (t.goals_against ?? 0) / played : 0;
        return {
          competition: baseLabel,
          goalsForPerMatch: Number(goalsForPerMatch.toFixed(2)),
          goalsAgainstPerMatch: Number(goalsAgainstPerMatch.toFixed(2)),
          possessionPct: t.possession_pct ?? 0,
          shotsPerMatch: t.shots_per_match ?? 0,
          shotsOnTargetPerMatch: t.shots_on_target_per_match ?? 0,
          cornersPerMatch: t.corners_per_match ?? 0,
          freeKicksPerMatch: t.free_kicks_per_match ?? 0,
          chancesPerMatch: t.chances_per_match ?? 0,
          cleanSheets: t.clean_sheets ?? 0,
          yellowCards: t.yellow_cards ?? 0,
          redCards: t.red_cards ?? 0,
        };
      };

      // Standings (extrait centré sur les 2 équipes, ou top 6 par défaut)
      const allStandings: StandingRow[] = enrichedTeams
        .filter((t) => t.standing_rank != null)
        .map((t) => ({
          position: t.standing_rank!,
          team: t.team_name,
          teamLogo: t.team_logo ?? undefined,
          played: t.played ?? 0,
          wins: t.wins ?? 0,
          draws: t.draws ?? 0,
          losses: t.losses ?? 0,
          goalsFor: t.goals_for ?? 0,
          goalsAgainst: t.goals_against ?? 0,
          goalDiff: (t.goals_for ?? 0) - (t.goals_against ?? 0),
          points: 0,
        }))
        .sort((a, b) => a.position - b.position);

      // Map H2H rows en RecentMatch (POV équipe domicile du pari)
      const homeId = home.api_team_id;
      const h2hMatches: RecentMatch[] = (h2hRows ?? []).map(
        (r: {
          match_date: string;
          score_low: number;
          score_high: number;
          team_low_id: number;
          team_high_id: number;
          competition: string | null;
        }) => {
          // Reconstitue POV "home du pari" vs "away du pari"
          const homeIsLow = homeId === r.team_low_id;
          const scoreHome = homeIsLow ? r.score_low : r.score_high;
          const scoreAway = homeIsLow ? r.score_high : r.score_low;
          const result: 'V' | 'N' | 'D' =
            scoreHome > scoreAway
              ? 'V'
              : scoreHome === scoreAway
                ? 'N'
                : 'D';
          return {
            date: formatShortDate(r.match_date),
            opponent: teamAway,
            scoreHome,
            scoreAway,
            isHome: true,
            result,
          };
        },
      );

      setStats({
        homeRecentMatches: (homeRecent ?? []).map(toRecentMatch),
        awayRecentMatches: (awayRecent ?? []).map(toRecentMatch),
        h2hMatches,
        homeSeasonStats: buildSeasonStats(homeRefreshed),
        awaySeasonStats: buildSeasonStats(awayRefreshed),
        homePosition: homeRefreshed.standing_rank ?? 0,
        awayPosition: awayRefreshed.standing_rank ?? 0,
        standings: allStandings,
        standingsLabel: `Classement ${baseLabel}`,
      });
      setIsLoading(false);
    })();
    return () => {
      ac.abort();
    };
  }, [competitionLabel, teamHome, teamAway, sport]);

  return { stats, isLoading };
}
