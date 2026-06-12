// AJ Pronos — Edge Function : fetch-matches
//
// Pull les matchs de J → J+2 depuis API-Football pour toutes les ligues
// trackées, et upsert dans la table `matches`.
//
// Déploiement :
//   supabase functions deploy fetch-matches
//
// Secrets requis :
//   - API_FOOTBALL_KEY (clé api-football.com)
//
// Cron (configurer dans Dashboard Supabase → Database → Cron Jobs) :
//   '0 6 * * *' (tous les jours à 6h UTC = 8h Paris)
//
// Quota : ~12 calls par run (1 call per league × 11 leagues + check).
// Sur plan Free 100/jour : OK pour 1 run quotidien. Sur Pro 7500/jour :
// largement OK pour 24 runs (1/h).

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';

// IDs API-Football des ligues qu'on tracke (synchro avec competitions.ts)
const TRACKED_LEAGUES: Array<{
  id: number;
  competitionId: string;
  label: string;
  season: number;
}> = [
  // Top 5 championnats européens
  { id: 61, competitionId: 'ligue-1', label: 'Ligue 1', season: 2026 },
  { id: 140, competitionId: 'la-liga', label: 'La Liga', season: 2026 },
  { id: 39, competitionId: 'premier-league', label: 'Premier League', season: 2026 },
  { id: 78, competitionId: 'bundesliga', label: 'Bundesliga', season: 2026 },
  { id: 135, competitionId: 'serie-a', label: 'Serie A', season: 2026 },
  // Portugal + Turquie
  { id: 94, competitionId: 'primeira-liga', label: 'Primeira Liga', season: 2026 },
  { id: 203, competitionId: 'super-lig', label: 'Süper Lig', season: 2026 },
  // Coupes nationales
  { id: 66, competitionId: 'coupe-de-france', label: 'Coupe de France', season: 2026 },
  { id: 45, competitionId: 'fa-cup', label: 'FA Cup', season: 2026 },
  { id: 48, competitionId: 'efl-cup', label: 'EFL Cup', season: 2026 },
  { id: 143, competitionId: 'copa-del-rey', label: 'Copa del Rey', season: 2026 },
  { id: 81, competitionId: 'dfb-pokal', label: 'DFB-Pokal', season: 2026 },
  { id: 137, competitionId: 'coppa-italia', label: 'Coppa Italia', season: 2026 },
  { id: 96, competitionId: 'taca-de-portugal', label: 'Taça de Portugal', season: 2026 },
  // UEFA clubs
  { id: 2, competitionId: 'champions-league', label: 'Champions League', season: 2026 },
  { id: 3, competitionId: 'europa-league', label: 'Europa League', season: 2026 },
  { id: 848, competitionId: 'conference-league', label: 'Conference League', season: 2026 },
  { id: 531, competitionId: 'uefa-super-cup', label: 'UEFA Super Cup', season: 2026 },
  // Équipes nationales
  { id: 1, competitionId: 'mondial', label: 'Coupe du Monde', season: 2026 },
  { id: 4, competitionId: 'euro', label: 'Euro', season: 2026 },
  { id: 5, competitionId: 'ligue-des-nations', label: 'Ligue des Nations', season: 2026 },
  { id: 9, competitionId: 'copa-america', label: 'Copa America', season: 2026 },
  { id: 6, competitionId: 'can', label: 'CAN', season: 2026 },
  // Amicaux (clubs + équipes nationales)
  { id: 667, competitionId: 'amical-clubs', label: 'Match amical', season: 2026 },
  { id: 10, competitionId: 'amical-nations', label: 'Match amical (nations)', season: 2026 },
  // ===== FOOT FÉMININ (ajouté 2026-06-09) =====
  { id: 64, competitionId: 'd1-arkema', label: 'D1 Arkema (F)', season: 2026 },
  { id: 44, competitionId: 'wsl', label: 'WSL (F)', season: 2026 },
  { id: 82, competitionId: 'frauen-bundesliga', label: 'Frauen-Bundesliga (F)', season: 2026 },
  { id: 197, competitionId: 'liga-f', label: 'Liga F (F)', season: 2026 },
  { id: 139, competitionId: 'serie-a-femminile', label: 'Serie A Femminile', season: 2026 },
  { id: 254, competitionId: 'nwsl', label: 'NWSL (F)', season: 2026 },
  { id: 528, competitionId: 'uwcl', label: 'UEFA Women\'s Champions League', season: 2026 },
  { id: 8, competitionId: 'mondial-f', label: 'Coupe du Monde Féminine', season: 2026 },
  { id: 33, competitionId: 'mondial-f-quali', label: 'Qualif. Mondial Féminin', season: 2026 },
  { id: 525, competitionId: 'euro-f', label: 'Euro Féminin', season: 2026 },
  { id: 527, competitionId: 'euro-f-quali', label: 'Qualif. Euro Féminin', season: 2026 },
  { id: 1040, competitionId: 'nations-league-f', label: 'Ligue des Nations Féminine', season: 2026 },
];

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
    venue?: { name?: string; city?: string };
  };
  league: { id: number; name: string; round: string; season: number };
  teams: {
    home: { id: number; name: string; logo: string };
    away: { id: number; name: string; logo: string };
  };
  goals: { home: number | null; away: number | null };
};

function mapStatus(short: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
  if (['NS', 'TBD'].includes(short)) return 'scheduled';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short)) return 'finished';
  if (short === 'PST') return 'postponed';
  if (['CANC', 'ABD'].includes(short)) return 'cancelled';
  return 'scheduled';
}

/** Extrait "J32" ou "1/4 finale" depuis le round API. */
function extractEtape(round: string): string {
  // "Regular Season - 32" → "J32"
  const seasonMatch = round.match(/Regular Season\s*-\s*(\d+)/i);
  if (seasonMatch) return `J${seasonMatch[1]}`;
  // "Group Stage - 2" (Mondial / Euro) → "Phase de groupes · J2"
  const groupStageMatch = round.match(/Group Stage\s*-\s*(\d+)/i);
  if (groupStageMatch) return `Phase de groupes · J${groupStageMatch[1]}`;
  // "Group A - 3" (Champions League) → "Poule A · J3"
  const groupMatch = round.match(/Group ([A-Z])\s*-\s*(\d+)/i);
  if (groupMatch) return `Poule ${groupMatch[1]} · J${groupMatch[2]}`;
  // Phases finales — labels API en anglais → traduction française
  const roundMap: Record<string, string> = {
    'round of 32': '1/16 finale',
    'round of 16': '1/8 finale',
    'quarter-finals': '1/4 finale',
    'semi-finals': '1/2 finale',
    'semi finals': '1/2 finale',
    '3rd place final': 'Petite finale',
    'play-offs': 'Barrages',
    'play offs': 'Barrages',
    final: 'Finale',
  };
  return roundMap[round.toLowerCase()] ?? round;
}

serve(async (req) => {
  // Sécurité : on accepte que les POST authentifiés ou GET locaux pour Cron
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = Deno.env.get('API_FOOTBALL_KEY');
  if (!apiKey) {
    return new Response('Missing API_FOOTBALL_KEY secret', { status: 500 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Parse body pour override la saison + la date.
  // Body options :
  //   { "season": 2024, "dateOverride": "2024-04-15" } → 1 jour précis
  //   { "pullFullSeasons": [1] } → pull TOUS les matchs de ces ligues (compétitions
  //                                courtes comme Mondial / Euro), pour backfill.
  //   {} → comportement normal : J/J+1/J+2 sur toutes les ligues trackées
  let bodyOverride: {
    season?: number;
    dateOverride?: string;
    pullFullSeasons?: number[];
  } = {};
  if (req.method === 'POST') {
    try {
      bodyOverride = await req.json();
    } catch {
      // body vide ou invalide, on ignore
    }
  }
  const overrideSeason = bodyOverride.season;
  const pullFullSeasons = new Set(bodyOverride.pullFullSeasons ?? []);

  // Fenêtre : aujourd'hui → +2 jours OU date fixée pour test
  const dates: string[] = [];
  if (bodyOverride.dateOverride) {
    dates.push(bodyOverride.dateOverride);
  } else {
    const now = new Date();
    for (let i = 0; i <= 2; i++) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() + i);
      dates.push(d.toISOString().slice(0, 10));
    }
  }

  let totalFetched = 0;
  let totalUpserted = 0;
  const errors: string[] = [];

  // Pour chaque ligue trackée, pull les fixtures dans la fenêtre.
  // Si la ligue est dans pullFullSeasons, on skip le filtre date et on
  // récupère TOUS les matchs de la saison (utile pour Mondial / Euro).
  for (const league of TRACKED_LEAGUES) {
    const seasonToUse = overrideSeason ?? league.season;
    const isFullSeason = pullFullSeasons.has(league.id);
    const datesForLeague = isFullSeason ? [null] : dates;
    for (const date of datesForLeague) {
      const url = date
        ? `${API_BASE}/fixtures?league=${league.id}&season=${seasonToUse}&date=${date}`
        : `${API_BASE}/fixtures?league=${league.id}&season=${seasonToUse}`;
      try {
        const res = await fetch(url, {
          headers: { 'x-apisports-key': apiKey },
        });
        if (!res.ok) {
          errors.push(`league=${league.id} date=${date}: HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        if (data.errors && Object.keys(data.errors).length > 0) {
          errors.push(`league=${league.id}: ${JSON.stringify(data.errors)}`);
          continue;
        }
        const fixtures = (data.response ?? []) as ApiFixture[];
        totalFetched += fixtures.length;

        // Upsert chaque fixture
        for (const f of fixtures) {
          const status = mapStatus(f.fixture.status.short);
          const etape = extractEtape(f.league.round);

          const { error } = await supabase.from('matches').upsert(
            {
              api_fixture_id: f.fixture.id,
              api_league_id: league.id,
              competition_id: league.competitionId,
              competition_label: league.label,
              competition_round: f.league.round,
              competition_etape: etape,
              sport: 'foot',
              season: seasonToUse,
              team_home: f.teams.home.name,
              team_home_api_id: f.teams.home.id,
              team_home_logo: f.teams.home.logo,
              team_away: f.teams.away.name,
              team_away_api_id: f.teams.away.id,
              team_away_logo: f.teams.away.logo,
              match_start_at: f.fixture.date,
              venue_name: f.fixture.venue?.name ?? null,
              venue_city: f.fixture.venue?.city ?? null,
              status,
              status_short: f.fixture.status.short,
              score_home: f.goals.home,
              score_away: f.goals.away,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'api_fixture_id' },
          );
          if (error) {
            errors.push(`upsert fixture ${f.fixture.id}: ${error.message}`);
          } else {
            totalUpserted++;
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Erreur inconnue';
        errors.push(`league=${league.id} date=${date}: ${msg}`);
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      fetched: totalFetched,
      upserted: totalUpserted,
      errors,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
