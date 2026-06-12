// AJ Pronos — Edge Function : fetch-h2h
//
// Récupère les confrontations directes (head-to-head) entre 2 équipes et
// les upsert dans la table team_head_to_head. Cache 24h côté DB.
//
// Body : { home_id, away_id, last? }
// Réponse : { ok, h2h_count }
//
// Volume : ~1 appel par paire d'équipes consultée pour la 1ère fois (puis
// cache 24h). Négligeable sur quota 7500/jour.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';

type FixtureRow = {
  fixture: { id: number; date: string };
  league: { id: number; name: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

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

  let body: { home_id?: number; away_id?: number; last?: number };
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const { home_id, away_id, last = 10 } = body;
  if (!home_id || !away_id) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing home_id / away_id' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Paire ordonnée pour pas dupliquer A-B et B-A en DB
  const low = Math.min(home_id, away_id);
  const high = Math.max(home_id, away_id);

  // Cache check : si on a déjà fetché ce h2h dans les dernières 24h, on
  // ne re-fetch pas.
  const { data: cached } = await supabase
    .from('team_head_to_head')
    .select('id, fetched_at')
    .eq('team_low_id', low)
    .eq('team_high_id', high)
    .order('fetched_at', { ascending: false })
    .limit(1);
  if (cached && cached.length > 0) {
    const lastFetch = new Date(cached[0].fetched_at).getTime();
    const ageMs = Date.now() - lastFetch;
    if (ageMs < 24 * 60 * 60 * 1000) {
      // Renvoie ce qu'on a déjà
      const { count } = await supabase
        .from('team_head_to_head')
        .select('id', { count: 'exact', head: true })
        .eq('team_low_id', low)
        .eq('team_high_id', high);
      return new Response(
        JSON.stringify({
          ok: true,
          h2h_count: count ?? 0,
          from_cache: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  // Fetch API-Football
  const url = `${API_BASE}/fixtures/headtohead?h2h=${home_id}-${away_id}&last=${last}`;
  let fixtures: FixtureRow[] = [];
  try {
    const res = await fetch(url, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (!res.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: `HTTP ${res.status}` }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const data = await res.json();
    fixtures = (data.response ?? []) as FixtureRow[];
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e instanceof Error ? e.message : 'fetch failed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const rows = fixtures
    .filter((f) => f.goals.home !== null && f.goals.away !== null)
    .map((f) => {
      // On stocke en paire ordonnée. score_low = score de l'équipe avec
      // le plus petit id, peu importe si c'était domicile ou pas dans
      // le match d'origine. POV résolu côté app.
      const homeIsLow = f.teams.home.id === low;
      const scoreLow = homeIsLow ? f.goals.home! : f.goals.away!;
      const scoreHigh = homeIsLow ? f.goals.away! : f.goals.home!;
      return {
        team_low_id: low,
        team_high_id: high,
        api_fixture_id: f.fixture.id,
        match_date: f.fixture.date,
        api_league_id: f.league.id,
        competition: f.league.name,
        score_low: scoreLow,
        score_high: scoreHigh,
        fetched_at: new Date().toISOString(),
      };
    });

  if (rows.length > 0) {
    const { error } = await supabase
      .from('team_head_to_head')
      .upsert(rows, {
        onConflict: 'team_low_id,team_high_id,api_fixture_id',
      });
    if (error) {
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      h2h_count: rows.length,
      from_cache: false,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
