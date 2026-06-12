// AJ Pronos — Edge Function : enrich-team-details
//
// Lazy enrichment : récupère pour UNE équipe :
//   1. Stats saison détaillées (possession, tirs, corners, cartons) → upsert
//      dans les colonnes étendues de team_stats
//   2. Les 10 derniers matchs (date, adversaire, score, V/N/D) → upsert dans
//      team_recent_matches
//
// Appelée depuis l'app mobile au moment où on ouvre le Stats Center pour
// une équipe dont les données ne sont pas encore en cache (ou cache > 24h).
//
// Body : { team_id, league_id, season }
// Réponse : { ok: true, recent_count: 10, stats_updated: true } | { ok:false, error }

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';

type Stats = {
  team: { id: number; name: string; logo: string };
  league: { id: number; season: number };
  fixtures: { played: { total: number } };
  goals: {
    for: { total: { total: number }; average: { total: string } };
    against: { total: { total: number }; average: { total: string } };
  };
  clean_sheet: { total: number };
  cards: {
    yellow: Record<string, { total: number }>;
    red: Record<string, { total: number }>;
  };
};

type FixtureRow = {
  fixture: { id: number; date: string };
  league: { id: number; season: number };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
};

type TeamStatsExtended = {
  possession_pct: number | null;
  shots_per_match: number | null;
  shots_on_target_per_match: number | null;
  corners_per_match: number | null;
  free_kicks_per_match: number | null;
  chances_per_match: number | null;
  clean_sheets: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
};

function sumCards(buckets: Record<string, { total: number }> | undefined): number {
  if (!buckets) return 0;
  return Object.values(buckets).reduce(
    (sum, b) => sum + (b?.total ?? 0),
    0,
  );
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  if (!apiKey) {
    return new Response('Missing API_FOOTBALL_KEY secret', { status: 500 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: { team_id?: number; league_id?: number; season?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { team_id, league_id, season } = body;
  if (!team_id || !league_id || !season) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Missing team_id / league_id / season',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const errors: string[] = [];

  // ============================================
  // 1) Stats saison détaillées
  // ============================================
  let statsUpdated = false;
  try {
    const statsUrl = `${API_BASE}/teams/statistics?team=${team_id}&league=${league_id}&season=${season}`;
    const res = await fetch(statsUrl, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (!res.ok) {
      errors.push(`stats HTTP ${res.status}`);
    } else {
      const data = await res.json();
      const s = data.response as Stats | undefined;
      if (s && s.fixtures?.played?.total > 0) {
        const played = s.fixtures.played.total;
        const cleanSheets = s.clean_sheet?.total ?? 0;
        const yellowCards = sumCards(s.cards?.yellow);
        const redCards = sumCards(s.cards?.red);
        // API ne renvoie pas directement possession/shots/corners en agrégat
        // équipe — ces stats sont par match. On les laisse null si non-dispo
        // (le panel Saison UI ignore les null gracieusement).
        const ext: TeamStatsExtended = {
          possession_pct: null,
          shots_per_match: null,
          shots_on_target_per_match: null,
          corners_per_match: null,
          free_kicks_per_match: null,
          chances_per_match: null,
          clean_sheets: cleanSheets,
          yellow_cards: yellowCards,
          red_cards: redCards,
        };
        const { error } = await supabase
          .from('team_stats')
          .update({ ...ext, updated_at: new Date().toISOString() })
          .eq('api_team_id', team_id)
          .eq('api_league_id', league_id)
          .eq('season', season);
        if (error) errors.push(`stats upsert: ${error.message}`);
        else statsUpdated = true;
      }
    }
  } catch (e) {
    errors.push(
      `stats fetch: ${e instanceof Error ? e.message : 'unknown'}`,
    );
  }

  // ============================================
  // 2) 10 derniers matchs
  // ============================================
  // Pour les amicaux (10, 667), qualifs internationales (33, 5, 1040, 527…)
  // et autres compés "courtes", on cherche les 10 derniers matchs SANS
  // filtre league (= toutes compés confondues). Sinon le résultat est
  // souvent vide car peu de matchs dans la compé spécifiée.
  // Pour les championnats domestiques (Ligue 1, Liga, etc.), on garde
  // le filtre league + season pour avoir des stats homogènes.
  const SHORT_FORMAT_LEAGUES = new Set([
    10, 667,                    // amicaux clubs + nations
    1, 4, 5, 9, 6,              // équipes nationales (Mondial, Euro, Nations, Copa, CAN)
    33, 527,                    // qualifs
    8, 525, 1040,               // féminin nations
  ]);
  let recentCount = 0;
  try {
    const useNoLeagueFilter = SHORT_FORMAT_LEAGUES.has(league_id);
    const fxUrl = useNoLeagueFilter
      ? `${API_BASE}/fixtures?team=${team_id}&last=10`
      : `${API_BASE}/fixtures?team=${team_id}&league=${league_id}&season=${season}&last=10`;
    const res = await fetch(fxUrl, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (!res.ok) {
      errors.push(`fixtures HTTP ${res.status}`);
    } else {
      const data = await res.json();
      const fixtures = (data.response ?? []) as FixtureRow[];
      const rows = fixtures
        .filter(
          (f) => f.goals.home !== null && f.goals.away !== null,
        )
        .map((f) => {
          const isHome = f.teams.home.id === team_id;
          const opponent = isHome ? f.teams.away : f.teams.home;
          const scoreFor = isHome ? f.goals.home! : f.goals.away!;
          const scoreAgainst = isHome ? f.goals.away! : f.goals.home!;
          const result =
            scoreFor > scoreAgainst
              ? 'V'
              : scoreFor === scoreAgainst
                ? 'N'
                : 'D';
          return {
            api_team_id: team_id,
            // Quand on fetch sans filtre league, on garde la VRAIE league
            // de chaque match (sinon on stockerait Brésil vs Égypte amical
            // comme un "match Mondial 2026").
            api_league_id: useNoLeagueFilter ? f.league.id : league_id,
            season: useNoLeagueFilter ? f.league.season : season,
            api_fixture_id: f.fixture.id,
            match_date: f.fixture.date,
            opponent_id: opponent.id,
            opponent_name: opponent.name,
            opponent_logo: opponent.logo,
            is_home: isHome,
            score_for: scoreFor,
            score_against: scoreAgainst,
            result,
            updated_at: new Date().toISOString(),
          };
        });
      if (rows.length > 0) {
        const { error } = await supabase
          .from('team_recent_matches')
          .upsert(rows, { onConflict: 'api_team_id,api_fixture_id' });
        if (error) errors.push(`recent upsert: ${error.message}`);
        else recentCount = rows.length;
      }
    }
  } catch (e) {
    errors.push(
      `fixtures fetch: ${e instanceof Error ? e.message : 'unknown'}`,
    );
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      stats_updated: statsUpdated,
      recent_count: recentCount,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
