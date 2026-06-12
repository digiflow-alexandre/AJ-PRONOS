// AJ Pronos — Edge Function : backfill-match-links
//
// Pour les paris foot SAISIS MANUELLEMENT (sans match_api_fixture_id),
// cherche le match correspondant dans API-Football et update la sélection
// avec l'identifiant trouvé.
//
// Bénéfices :
//  - Stats Center fonctionne sur les paris manuels passés
//  - Tracking auto possible si match pas encore résolu manuellement
//  - Résumé statistique généré (via le hook useStatSummary côté front)
//
// À déclencher MANUELLEMENT via SQL Editor :
//   select net.http_post(
//     url := 'https://kselqtxklyalgwwovnll.supabase.co/functions/v1/backfill-match-links',
//     headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', ...),
//     timeout_milliseconds := 120000
//   );
//
// Conso API : 1 call par jour-ligue (lookup `/fixtures?date&league`). Pour
// 50 paris manuels répartis sur ~30 jours et ~5 ligues différentes
// = max ~150 calls. Quota Pro = 7500/jour → négligeable.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';

// Mapping compétition label → api_league_id (synchro avec FOOT_COMPETITIONS
// côté mobile). Si une compé n'est pas dans cette map → on ne peut pas
// la backfill (la sélection reste sans lien).
const LEAGUE_ID_BY_LABEL: Record<string, number> = {
  'ligue 1': 61,
  'la liga': 140,
  'premier league': 39,
  'bundesliga': 78,
  'serie a': 135,
  'primeira liga': 94,
  'süper lig': 203,
  'super lig': 203,
  'coupe de france': 66,
  'fa cup': 45,
  'efl cup': 48,
  'copa del rey': 143,
  'dfb-pokal': 81,
  'dfb pokal': 81,
  'coppa italia': 137,
  'taça de portugal': 96,
  'taca de portugal': 96,
  'champions league': 2,
  'europa league': 3,
  'conference league': 848,
  'uefa super cup': 531,
  'coupe du monde': 1,
  'euro': 4,
  'ligue des nations': 5,
  'copa america': 9,
  'can': 6,
  'match amical': 667,
  'match amical (nations)': 10,
  // Féminin
  'd1 arkema (f)': 64,
  'wsl (f)': 44,
  'frauen-bundesliga (f)': 82,
  'liga f (f)': 197,
  'serie a femminile': 139,
  'nwsl (f)': 254,
  'uefa women\'s champions league': 528,
  'coupe du monde féminine': 8,
  'qualif. mondial féminin': 33,
  'euro féminin': 525,
  'qualif. euro féminin': 527,
  'ligue des nations féminine': 1040,
};

// Map nations FR → EN (extrait du dico côté mobile pour le matching)
const NATION_FR_TO_EN: Record<string, string> = {
  'allemagne': 'Germany',
  'angleterre': 'England',
  'autriche': 'Austria',
  'belgique': 'Belgium',
  'brésil': 'Brazil',
  'bresil': 'Brazil',
  'croatie': 'Croatia',
  'danemark': 'Denmark',
  'écosse': 'Scotland',
  'ecosse': 'Scotland',
  'égypte': 'Egypt',
  'egypte': 'Egypt',
  'espagne': 'Spain',
  'états-unis': 'United States',
  'etats-unis': 'United States',
  'finlande': 'Finland',
  'grèce': 'Greece',
  'grece': 'Greece',
  'hongrie': 'Hungary',
  'irlande': 'Ireland',
  'islande': 'Iceland',
  'italie': 'Italy',
  'japon': 'Japan',
  'maroc': 'Morocco',
  'mexique': 'Mexico',
  'nigéria': 'Nigeria',
  'nigeria': 'Nigeria',
  'norvège': 'Norway',
  'norvege': 'Norway',
  'pays-bas': 'Netherlands',
  'pologne': 'Poland',
  'portugal': 'Portugal',
  'roumanie': 'Romania',
  'sénégal': 'Senegal',
  'senegal': 'Senegal',
  'suède': 'Sweden',
  'suede': 'Sweden',
  'suisse': 'Switzerland',
  'tunisie': 'Tunisia',
  'turquie': 'Turkey',
  'ukraine': 'Ukraine',
  'pays de galles': 'Wales',
  'arabie saoudite': 'Saudi Arabia',
  'corée du sud': 'South Korea',
  'coree du sud': 'South Korea',
  'côte d\'ivoire': 'Ivory Coast',
  'cote d\'ivoire': 'Ivory Coast',
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,'’\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Map normalisée des labels de compétition → api_league_id. On normalise
// les clés au montage pour matcher robustement (insensible à la
// ponctuation et aux accents).
const NORMALIZED_LEAGUE_MAP: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  for (const [label, id] of Object.entries(LEAGUE_ID_BY_LABEL)) {
    out[normalize(label)] = id;
  }
  return out;
})();

/** Convertit une saisie FR (Allemagne) en nom EN (Germany) pour matcher API. */
function toEnglishNation(s: string): string {
  const norm = normalize(s);
  return NATION_FR_TO_EN[norm] ?? s;
}

/** Match tolérant : "PSG" matche "Paris Saint Germain", "Allemagne" matche "Germany". */
function teamMatches(saisie: string, apiName: string): boolean {
  if (!saisie || !apiName) return false;
  const sEn = toEnglishNation(saisie);
  const a = normalize(sEn);
  const b = normalize(apiName);
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  // Initiales : PSG vs Paris Saint Germain
  const bTokens = b.split(' ').filter((w) => w.length >= 2);
  if (bTokens.length >= 2) {
    const initials = bTokens.map((t) => t[0]).join('');
    if (initials === a) return true;
  }
  return false;
}

type ApiFixture = {
  fixture: { id: number; date: string };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
};

serve(async (req) => {
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

  // 1) Récupère toutes les sélections foot SANS match_api_fixture_id
  const { data: selections, error } = await supabase
    .from('published_bet_selections')
    .select(
      'id, sport, competition, team_home, team_away, match_start_at, match_api_fixture_id',
    )
    .eq('sport', 'foot')
    .is('match_api_fixture_id', null);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!selections || selections.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: 'Aucune sélection à backfill', linked: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 2) Cache des fixtures par "league|date" pour éviter de re-fetch
  //    plusieurs fois la même page si plusieurs sélections sont du même
  //    jour-ligue (combos).
  const fixtureCache = new Map<string, ApiFixture[]>();

  let linked = 0;
  let notFound = 0;
  let skippedNoLeague = 0;
  const errors: string[] = [];

  for (const sel of selections) {
    const compLabel = normalize(
      (sel.competition as string).split('·')[0].trim(),
    );
    const leagueId = NORMALIZED_LEAGUE_MAP[compLabel];
    if (!leagueId) {
      skippedNoLeague++;
      continue;
    }

    // Date au format YYYY-MM-DD (local UTC suffit ici, on cherche dans
    // une fenêtre J±1 si premier essai échoue)
    const matchDate = new Date(sel.match_start_at as string);
    const datesToTry = [
      matchDate.toISOString().slice(0, 10),
      new Date(matchDate.getTime() - 86400000).toISOString().slice(0, 10),
      new Date(matchDate.getTime() + 86400000).toISOString().slice(0, 10),
    ];

    // Saison : on essaye l'année du match, puis -1 (cas saisons à cheval)
    const year = matchDate.getFullYear();
    const seasonsToTry = [year, year - 1];

    let foundFixture: ApiFixture | null = null;
    for (const season of seasonsToTry) {
      if (foundFixture) break;
      for (const date of datesToTry) {
        const cacheKey = `${leagueId}|${date}|${season}`;
        let fixtures = fixtureCache.get(cacheKey);
        if (!fixtures) {
          try {
            const res = await fetch(
              `${API_BASE}/fixtures?league=${leagueId}&season=${season}&date=${date}`,
              { headers: { 'x-apisports-key': apiKey } },
            );
            if (!res.ok) {
              errors.push(`HTTP ${res.status} for ${cacheKey}`);
              continue;
            }
            const data = await res.json();
            fixtures = (data.response ?? []) as ApiFixture[];
            fixtureCache.set(cacheKey, fixtures);
          } catch (e) {
            errors.push(
              `${cacheKey}: ${e instanceof Error ? e.message : 'fetch failed'}`,
            );
            continue;
          }
        }
        if (fixtures.length === 0) continue;

        // Match équipes
        const homeName = sel.team_home as string;
        const awayName = sel.team_away as string;
        const match = fixtures.find(
          (f) =>
            (teamMatches(homeName, f.teams.home.name) &&
              teamMatches(awayName, f.teams.away.name)) ||
            // Inversion possible (home/away)
            (teamMatches(homeName, f.teams.away.name) &&
              teamMatches(awayName, f.teams.home.name)),
        );
        if (match) {
          foundFixture = match;
          break;
        }
      }
    }

    if (!foundFixture) {
      notFound++;
      continue;
    }

    // 3) Update la sélection avec l'ID trouvé
    const { error: updErr } = await supabase
      .from('published_bet_selections')
      .update({
        match_api_fixture_id: foundFixture.fixture.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sel.id);
    if (updErr) {
      errors.push(`update ${sel.id}: ${updErr.message}`);
    } else {
      linked++;
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      checked: selections.length,
      linked,
      not_found: notFound,
      skipped_no_league: skippedNoLeague,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
