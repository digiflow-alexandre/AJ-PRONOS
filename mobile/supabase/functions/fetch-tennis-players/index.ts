// AJ Pronos — Edge Function : fetch-tennis-players
//
// Sync quotidien des joueurs ATP + WTA singles (top 200 chacun).
//
// Flow :
//   1) get_standings?event_type=ATP → liste top 200 + ranking + points + movement
//   2) get_standings?event_type=WTA → idem
//   3) Pour chaque joueur, get_players?player_key=X → bio + stats[] + tournaments[]
//   4) Calcule agrégats (career/season win rate par surface, nb titres)
//   5) Upsert dans tennis_players
//
// Conso API : ~402 calls/jour (2 standings + ~400 get_players).
//   Quota Starter : 8000/jour → on est à 5%.
//
// Cron : daily 6h UTC (voir migration 024).
//
// Note : les doublistes ne sont PAS sync ici. Ils sont découverts au fil
// des fixtures par fetch-tennis-matches et ajoutés à la table.
//
// Déploiement :
//   supabase functions deploy fetch-tennis-players --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://api.api-tennis.com/tennis/';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apiKey = Deno.env.get('API_TENNIS_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

// Nombre max de joueurs à enrichir par circuit (limite conso API).
// Top 200 ATP + top 200 WTA suffisent : Julien ne mise que sur des joueurs
// dans le top 200 mondial. Ajustable plus tard.
const TOP_N_BY_CIRCUIT = 200;

// Parallélisme par batch pour rester sous le timeout Supabase de 150s.
// 10 calls API simultanés × ~1.5s/call = ~1.5s/batch → ~30s pour 200 joueurs.
const CONCURRENCY = 10;

// Skip les joueurs déjà sync depuis moins de TTL_HOURS (re-runs rapides).
const TTL_HOURS = 24;

const CURRENT_SEASON = new Date().getUTCFullYear().toString();

type ApiStanding = {
  place: string;
  player: string;
  player_key: string;
  league: 'ATP' | 'WTA';
  movement: 'up' | 'down' | 'same';
  country: string;
  points: string;
};

type ApiPlayerStat = {
  season: string;
  type: 'singles' | 'doubles' | 'mixed_doubles';
  rank: string;
  titles: string;
  matches_won: string;
  matches_lost: string;
  hard_won?: string;
  hard_lost?: string;
  clay_won?: string;
  clay_lost?: string;
  grass_won?: string;
  grass_lost?: string;
};

type ApiPlayer = {
  player_key: string;
  player_name: string;
  player_full_name?: string;
  player_country?: string;
  player_bday?: string; // "DD.MM.YYYY"
  player_logo?: string | null;
  stats?: ApiPlayerStat[];
  tournaments?: unknown[];
};

function apiUrl(method: string, params: Record<string, string> = {}): string {
  const q = new URLSearchParams({ method, APIkey: apiKey, ...params });
  return `${API_BASE}?${q.toString()}`;
}

function parseFrenchDate(s: string | undefined): string | null {
  // Format API : "DD.MM.YYYY" → "YYYY-MM-DD"
  if (!s || !/^\d{2}\.\d{2}\.\d{4}$/.test(s)) return null;
  const [d, m, y] = s.split('.');
  return `${y}-${m}-${d}`;
}

function toIntSafe(s: string | undefined | null): number | null {
  if (s == null || s === '') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function rate(won: number, lost: number): number | null {
  const total = won + lost;
  if (total === 0) return null;
  return Math.round((won / total) * 10000) / 100; // 2 decimals
}

type Aggregates = {
  career_titles: number;
  career_win_rate: number | null;
  career_hard_win_rate: number | null;
  career_clay_win_rate: number | null;
  career_grass_win_rate: number | null;
  season_titles: number;
  season_win_rate: number | null;
  season_hard_win_rate: number | null;
  season_clay_win_rate: number | null;
  season_grass_win_rate: number | null;
};

function computeAggregates(stats: ApiPlayerStat[] | undefined): Aggregates {
  const singlesStats = (stats ?? []).filter((s) => s.type === 'singles');
  // Career = somme sur toutes les seasons
  let careerTitles = 0;
  let careerWon = 0, careerLost = 0;
  let careerHardWon = 0, careerHardLost = 0;
  let careerClayWon = 0, careerClayLost = 0;
  let careerGrassWon = 0, careerGrassLost = 0;
  for (const s of singlesStats) {
    careerTitles += toIntSafe(s.titles) ?? 0;
    careerWon += toIntSafe(s.matches_won) ?? 0;
    careerLost += toIntSafe(s.matches_lost) ?? 0;
    careerHardWon += toIntSafe(s.hard_won) ?? 0;
    careerHardLost += toIntSafe(s.hard_lost) ?? 0;
    careerClayWon += toIntSafe(s.clay_won) ?? 0;
    careerClayLost += toIntSafe(s.clay_lost) ?? 0;
    careerGrassWon += toIntSafe(s.grass_won) ?? 0;
    careerGrassLost += toIntSafe(s.grass_lost) ?? 0;
  }

  // Season = entrée pour CURRENT_SEASON (ou plus récente si pas encore d'entrée)
  const seasonStat =
    singlesStats.find((s) => s.season === CURRENT_SEASON) ??
    [...singlesStats].sort((a, b) => Number(b.season) - Number(a.season))[0];

  const seasonWon = toIntSafe(seasonStat?.matches_won) ?? 0;
  const seasonLost = toIntSafe(seasonStat?.matches_lost) ?? 0;
  const seasonHardWon = toIntSafe(seasonStat?.hard_won) ?? 0;
  const seasonHardLost = toIntSafe(seasonStat?.hard_lost) ?? 0;
  const seasonClayWon = toIntSafe(seasonStat?.clay_won) ?? 0;
  const seasonClayLost = toIntSafe(seasonStat?.clay_lost) ?? 0;
  const seasonGrassWon = toIntSafe(seasonStat?.grass_won) ?? 0;
  const seasonGrassLost = toIntSafe(seasonStat?.grass_lost) ?? 0;

  return {
    career_titles: careerTitles,
    career_win_rate: rate(careerWon, careerLost),
    career_hard_win_rate: rate(careerHardWon, careerHardLost),
    career_clay_win_rate: rate(careerClayWon, careerClayLost),
    career_grass_win_rate: rate(careerGrassWon, careerGrassLost),
    season_titles: toIntSafe(seasonStat?.titles) ?? 0,
    season_win_rate: rate(seasonWon, seasonLost),
    season_hard_win_rate: rate(seasonHardWon, seasonHardLost),
    season_clay_win_rate: rate(seasonClayWon, seasonClayLost),
    season_grass_win_rate: rate(seasonGrassWon, seasonGrassLost),
  };
}

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[fetch-tennis-players] HTTP ${res.status} on ${url}`);
      return null;
    }
    const json = await res.json();
    if (json.success !== 1) {
      console.error(`[fetch-tennis-players] API error:`, json.error ?? json);
      return null;
    }
    return json.result as T;
  } catch (e) {
    console.error(`[fetch-tennis-players] fetch failed:`, e);
    return null;
  }
}

async function syncCircuit(circuit: 'ATP' | 'WTA'): Promise<{ upserted: number; errors: number; skipped: number }> {
  const standings = await fetchJson<ApiStanding[]>(
    apiUrl('get_standings', { event_type: circuit }),
  );
  if (!standings || standings.length === 0) {
    return { upserted: 0, errors: 1, skipped: 0 };
  }

  const topPlayers = standings.slice(0, TOP_N_BY_CIRCUIT);

  // Skip les joueurs déjà sync depuis moins de TTL_HOURS (re-runs rapides)
  const playerKeys = topPlayers.map((s) => s.player_key);
  const { data: recentlySynced } = await supabase
    .from('tennis_players')
    .select('api_player_key, api_synced_at')
    .in('api_player_key', playerKeys);
  const ttlCutoff = Date.now() - TTL_HOURS * 3600 * 1000;
  const skipSet = new Set(
    (recentlySynced ?? [])
      .filter((p) =>
        p.api_synced_at && new Date(p.api_synced_at).getTime() > ttlCutoff,
      )
      .map((p) => p.api_player_key as string),
  );

  const toFetch = topPlayers.filter((s) => !skipSet.has(s.player_key));
  console.log(
    `[fetch-tennis-players] ${circuit} : ${topPlayers.length} top — ${skipSet.size} skipped (TTL) — ${toFetch.length} à enrichir`,
  );

  let upserted = 0;
  let errors = 0;

  // Parallélisme par batch pour rester sous le timeout Supabase
  for (let i = 0; i < toFetch.length; i += CONCURRENCY) {
    const batch = toFetch.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (standing) => {
        const player = await fetchJson<ApiPlayer | ApiPlayer[]>(
          apiUrl('get_players', { player_key: standing.player_key }),
        );
        const playerData: ApiPlayer | null = Array.isArray(player)
          ? player[0] ?? null
          : player;
        if (!playerData) return { ok: false as const };

        const aggregates = computeAggregates(playerData.stats);
        const row = {
          api_player_key: standing.player_key,
          name: playerData.player_name || standing.player,
          full_name: playerData.player_full_name || null,
          country: playerData.player_country || standing.country || null,
          is_pair: false,
          gender: circuit === 'ATP' ? 'M' : 'F',
          circuit,
          ranking: toIntSafe(standing.place),
          ranking_points: toIntSafe(standing.points),
          ranking_movement: standing.movement || null,
          birthday: parseFrenchDate(playerData.player_bday),
          logo_url: playerData.player_logo || null,
          ...aggregates,
          raw_stats: playerData.stats ?? [],
          raw_tournaments: playerData.tournaments ?? [],
          api_synced_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('tennis_players')
          .upsert(row, { onConflict: 'api_player_key' });
        if (error) {
          console.error(`[fetch-tennis-players] upsert ${standing.player_key}:`, error.message);
          return { ok: false as const };
        }
        return { ok: true as const };
      }),
    );
    for (const r of results) {
      if (r.ok) upserted++;
      else errors++;
    }
  }

  return { upserted, errors, skipped: skipSet.size };
}

serve(async (req) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing API_TENNIS_KEY secret' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const start = Date.now();
  // Les 2 circuits en parallèle (réseau API + DB indépendants)
  const [atpResult, wtaResult] = await Promise.all([
    syncCircuit('ATP'),
    syncCircuit('WTA'),
  ]);
  const durationMs = Date.now() - start;

  return new Response(
    JSON.stringify({
      ok: true,
      atp: atpResult,
      wta: wtaResult,
      duration_ms: durationMs,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
