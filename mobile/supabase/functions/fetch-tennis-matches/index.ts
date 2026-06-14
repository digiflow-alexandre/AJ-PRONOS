// AJ Pronos — Edge Function : fetch-tennis-matches
//
// Sync des matchs tennis (ATP + WTA, singles + doubles) sur une fenêtre
// glissante : 1 jour passé → 7 jours à venir.
//
// Flow :
//   1) get_tournaments → map tournament_key → surface (mis en cache mémoire)
//   2) Pour chaque event_type_key cible (ATP Singles 265, ATP Doubles 267,
//      WTA Singles 266, WTA Doubles 268) → get_fixtures sur la fenêtre
//   3) Upsert dans matches (avec sport='tennis')
//   4) Détecte les player_keys inconnus → placeholder dans tennis_players
//      (enrichissement complet au prochain fetch-tennis-players)
//
// Conso API : ~5 calls/run (1 tournaments + 4 fixtures). Petit même horaire.
//
// Cron : daily 7h UTC (full sync 7j) + hourly (sync jour J pour scores live).
//
// Déploiement :
//   supabase functions deploy fetch-tennis-matches --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://api.api-tennis.com/tennis/';
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const apiKey = Deno.env.get('API_TENNIS_KEY')!;
const supabase = createClient(supabaseUrl, serviceKey);

// Circuits ciblés en V1 : ATP + WTA, singles + doubles
const CIRCUITS: Array<{
  event_type_key: number;
  circuit: 'ATP' | 'WTA' | 'ATP_DOUBLES' | 'WTA_DOUBLES';
  is_doubles: boolean;
  gender: 'M' | 'F';
}> = [
  { event_type_key: 265, circuit: 'ATP',         is_doubles: false, gender: 'M' },
  { event_type_key: 267, circuit: 'ATP_DOUBLES', is_doubles: true,  gender: 'M' },
  { event_type_key: 266, circuit: 'WTA',         is_doubles: false, gender: 'F' },
  { event_type_key: 268, circuit: 'WTA_DOUBLES', is_doubles: true,  gender: 'F' },
];

const SURFACE_MAP: Record<string, 'hard' | 'clay' | 'grass' | 'hard_indoor' | 'carpet'> = {
  'hard': 'hard',
  'clay': 'clay',
  'grass': 'grass',
  'hard (indoor)': 'hard_indoor',
  'carpet': 'carpet',
};

type ApiTournament = {
  tournament_key: string;
  tournament_name: string;
  event_type_key: string;
  event_type_type: string;
  tournament_sourface?: string; // typo de l'API, c'est bien "sourface"
};

type ApiFixture = {
  event_key: string | number;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:MM
  event_first_player: string;
  first_player_key: string;
  event_second_player: string;
  second_player_key: string;
  event_first_player_logo?: string | null;
  event_second_player_logo?: string | null;
  event_final_result: string; // "2 - 0" ou "0 - 0"
  event_status: string; // "Finished" / "Set 1" / "" / "Walkover" / "Cancelled" / "Postponed"
  event_winner: 'First Player' | 'Second Player' | null;
  event_type_type: string;
  tournament_name: string;
  tournament_key: string;
  tournament_round: string;
  tournament_season: string;
  scores?: Array<{ score_first: string; score_second: string; score_set: string }>;
  statistics?: unknown[];
};

function apiUrl(method: string, params: Record<string, string> = {}): string {
  const q = new URLSearchParams({ method, APIkey: apiKey, ...params });
  return `${API_BASE}?${q.toString()}`;
}

async function fetchJson<T = unknown>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`[fetch-tennis-matches] HTTP ${res.status} on ${url.slice(0, 120)}`);
      return null;
    }
    const json = await res.json();
    if (json.success !== 1) {
      console.error(`[fetch-tennis-matches] API error:`, json.error ?? json);
      return null;
    }
    return json.result as T;
  } catch (e) {
    console.error(`[fetch-tennis-matches] fetch failed:`, e);
    return null;
  }
}

function toIntSafe(s: string | number | undefined | null): number | null {
  if (s == null || s === '') return null;
  const n = typeof s === 'number' ? s : parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function mapStatus(s: string): 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed' {
  if (!s) return 'scheduled';
  const lower = s.toLowerCase();
  if (lower === 'finished') return 'finished';
  if (lower === 'walkover' || lower === 'cancelled' || lower === 'retired') return 'cancelled';
  if (lower === 'postponed') return 'postponed';
  // "Set 1", "Set 2", "Tiebreak" → live
  return 'live';
}

function parseScoreSets(finalResult: string): { home: number | null; away: number | null } {
  // "2 - 0" → { home: 2, away: 0 }
  const match = finalResult?.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) return { home: null, away: null };
  return { home: parseInt(match[1], 10), away: parseInt(match[2], 10) };
}

function buildStartAtIso(date: string, time: string): string {
  // L'API renvoie en Europe/Berlin par défaut (on n'a pas passé timezone).
  // Pour Berlin été = UTC+2, hiver = UTC+1. Simplification V1 : on stocke
  // l'heure brute en assumant timezone API par défaut. Le front affichera
  // avec timezone locale du device.
  // Format ISO "YYYY-MM-DDTHH:MM:00+02:00" (Europe/Berlin été — approximation V1).
  // TODO V1.5 : passer `timezone=UTC` à l'API pour avoir des UTC clean.
  return `${date}T${time || '00:00'}:00+02:00`;
}

async function loadTournamentSurfaces(): Promise<Map<string, string>> {
  // Charge une seule fois tous les tournois pour avoir le mapping
  // tournament_key → surface. Coût : 1 call (~5000 tournois retournés).
  const tournaments = await fetchJson<ApiTournament[]>(apiUrl('get_tournaments'));
  const map = new Map<string, string>();
  if (!tournaments) return map;
  for (const t of tournaments) {
    const surf = t.tournament_sourface?.toLowerCase();
    if (surf && SURFACE_MAP[surf]) {
      map.set(t.tournament_key, SURFACE_MAP[surf]);
    }
  }
  console.log(`[fetch-tennis-matches] surfaces : ${map.size} tournois mappés`);
  return map;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function syncCircuit(
  cfg: typeof CIRCUITS[number],
  dateStart: string,
  dateStop: string,
  surfaceMap: Map<string, string>,
  knownPlayerKeys: Set<string>,
  newPlayers: Map<string, { name: string; circuit: string; gender: 'M'|'F'; is_pair: boolean }>,
): Promise<{ upserted: number; errors: number }> {
  const fixtures = await fetchJson<ApiFixture[]>(
    apiUrl('get_fixtures', {
      date_start: dateStart,
      date_stop: dateStop,
      event_type_key: cfg.event_type_key.toString(),
    }),
  );
  if (!fixtures || fixtures.length === 0) {
    return { upserted: 0, errors: 0 };
  }
  console.log(`[fetch-tennis-matches] ${cfg.circuit} : ${fixtures.length} fixtures`);

  let upserted = 0;
  let errors = 0;

  for (const f of fixtures) {
    const apiFixtureId = toIntSafe(f.event_key);
    if (apiFixtureId == null) {
      errors++;
      continue;
    }
    const score = parseScoreSets(f.event_final_result);
    const status = mapStatus(f.event_status);
    const isFinished = status === 'finished';

    const row = {
      api_fixture_id: apiFixtureId,
      api_league_id: cfg.event_type_key,
      competition_id: f.tournament_key,
      competition_label: f.tournament_name,
      competition_round: f.tournament_round || null,
      sport: 'tennis',
      season: toIntSafe(f.tournament_season) ?? new Date().getUTCFullYear(),
      team_home: f.event_first_player,
      team_home_api_id: toIntSafe(f.first_player_key),
      team_home_logo: f.event_first_player_logo || null,
      team_away: f.event_second_player,
      team_away_api_id: toIntSafe(f.second_player_key),
      team_away_logo: f.event_second_player_logo || null,
      match_start_at: buildStartAtIso(f.event_date, f.event_time),
      status,
      status_short: f.event_status || null,
      score_home: isFinished ? score.home : null,
      score_away: isFinished ? score.away : null,
      surface: surfaceMap.get(f.tournament_key) || null,
      round: f.tournament_round || null,
      is_doubles: cfg.is_doubles,
      sets_detail: f.scores ?? null,
      winner_side: f.event_winner === 'First Player'
        ? 'home'
        : f.event_winner === 'Second Player'
          ? 'away'
          : null,
      tennis_statistics: isFinished && f.statistics?.length ? f.statistics : null,
    };

    const { error } = await supabase
      .from('matches')
      .upsert(row, { onConflict: 'api_fixture_id' });

    if (error) {
      console.error(`[fetch-tennis-matches] upsert ${apiFixtureId}:`, error.message);
      errors++;
    } else {
      upserted++;
    }

    // Détecte les nouveaux joueurs / paires
    for (const [key, name] of [
      [f.first_player_key, f.event_first_player],
      [f.second_player_key, f.event_second_player],
    ] as Array<[string, string]>) {
      if (key && !knownPlayerKeys.has(key) && !newPlayers.has(key)) {
        newPlayers.set(key, {
          name,
          circuit: cfg.circuit,
          gender: cfg.gender,
          is_pair: cfg.is_doubles || name.includes('/'),
        });
      }
    }
  }

  return { upserted, errors };
}

async function upsertNewPlayers(
  newPlayers: Map<string, { name: string; circuit: string; gender: 'M'|'F'; is_pair: boolean }>,
): Promise<number> {
  if (newPlayers.size === 0) return 0;
  const rows = Array.from(newPlayers.entries()).map(([key, p]) => ({
    api_player_key: key,
    name: p.name,
    is_pair: p.is_pair,
    gender: p.gender,
    circuit: p.circuit,
    // Pas d'enrichissement ici : fetch-tennis-players le fera au prochain run.
  }));
  // Upsert en batch (ignore les conflits sur api_player_key)
  const { error } = await supabase
    .from('tennis_players')
    .upsert(rows, { onConflict: 'api_player_key', ignoreDuplicates: true });
  if (error) {
    console.error('[fetch-tennis-matches] upsert new players:', error.message);
    return 0;
  }
  return rows.length;
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

  // Fenêtre par défaut : 1 jour passé → 7 jours à venir.
  // Surchargeable via body { date_start, date_stop } pour les backfills
  // ponctuels (ex : combiné de Julien posté en retard, matchs passés).
  let dateStart: string;
  let dateStop: string;
  try {
    const body = await req.json().catch(() => null);
    if (body?.date_start && body?.date_stop) {
      dateStart = String(body.date_start);
      dateStop = String(body.date_stop);
    } else {
      throw new Error('use default window');
    }
  } catch {
    const now = new Date();
    dateStart = ymd(new Date(now.getTime() - 24 * 3600 * 1000));
    dateStop = ymd(new Date(now.getTime() + 7 * 24 * 3600 * 1000));
  }

  // 1) Mapping tournament_key → surface
  const surfaceMap = await loadTournamentSurfaces();

  // 2) Liste des player_keys déjà connus en DB pour détecter les nouveaux
  const { data: existing } = await supabase
    .from('tennis_players')
    .select('api_player_key');
  const knownPlayerKeys = new Set((existing ?? []).map((p) => p.api_player_key as string));

  const newPlayers = new Map<string, { name: string; circuit: string; gender: 'M'|'F'; is_pair: boolean }>();

  // 3) Sync circuit par circuit
  const results: Record<string, { upserted: number; errors: number }> = {};
  for (const cfg of CIRCUITS) {
    results[cfg.circuit] = await syncCircuit(
      cfg, dateStart, dateStop, surfaceMap, knownPlayerKeys, newPlayers,
    );
  }

  // 4) Ajoute les nouveaux joueurs (placeholders)
  const addedPlayers = await upsertNewPlayers(newPlayers);

  const durationMs = Date.now() - start;
  return new Response(
    JSON.stringify({
      ok: true,
      window: { date_start: dateStart, date_stop: dateStop },
      results,
      new_players_added: addedPlayers,
      duration_ms: durationMs,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
});
