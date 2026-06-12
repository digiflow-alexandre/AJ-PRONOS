// AJ Pronos — Edge Function : refresh-team-stats
//
// Pull les stats des équipes (forme W/D/L, classement) pour les ligues
// trackées et upsert dans la table `team_stats`.
//
// Cron recommandé : '0 */6 * * *' (toutes les 6h)
//
// Quota : ~22 calls par run (2 par ligue × 11 ligues : standings + team_stats).
// Sur Free 100/jour : 1 run/jour max. Sur Pro 7500/jour : 1 run/heure sans souci.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';

const TRACKED_LEAGUES: Array<{ id: number; season: number }> = [
  // Top 5 européens
  { id: 61, season: 2026 },    // Ligue 1
  { id: 140, season: 2026 },   // La Liga
  { id: 39, season: 2026 },    // Premier League
  { id: 78, season: 2026 },    // Bundesliga
  { id: 135, season: 2026 },   // Serie A
  // Portugal + Turquie
  { id: 94, season: 2026 },    // Primeira Liga
  { id: 203, season: 2026 },   // Süper Lig
  // UEFA clubs
  { id: 2, season: 2026 },     // Champions League
  { id: 3, season: 2026 },     // Europa League
  { id: 848, season: 2026 },   // Conference League
  // Équipes nationales
  { id: 1, season: 2026 },     // Coupe du Monde
  { id: 4, season: 2026 },     // Euro
  { id: 5, season: 2026 },     // Ligue des Nations
  { id: 9, season: 2026 },     // Copa America
  { id: 6, season: 2026 },     // CAN
  // Note : pas de standings pour les coupes nationales (KO format), donc
  // pas dans cette liste. fetch-matches les tracke quand même.
  // ===== FÉMININ (ajouté 2026-06-09) =====
  // Championnats féminins (standings dispo)
  { id: 64, season: 2026 },    // D1 Arkema
  { id: 44, season: 2026 },    // WSL
  { id: 82, season: 2026 },    // Frauen-Bundesliga
  { id: 197, season: 2026 },   // Liga F
  { id: 139, season: 2026 },   // Serie A Femminile
  { id: 254, season: 2026 },   // NWSL
  // UEFA clubs féminins (phase de poules)
  { id: 528, season: 2026 },   // UEFA Women's Champions League
  // Équipes nationales féminines (qualif + phases finales)
  { id: 8, season: 2026 },     // Coupe du Monde Féminine
  { id: 33, season: 2026 },    // Qualif. Mondial Féminin
  { id: 525, season: 2026 },   // Euro Féminin
  { id: 527, season: 2026 },   // Qualif. Euro Féminin
  { id: 1040, season: 2026 },  // Ligue des Nations Féminine
];

type StandingTeam = {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  group?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  form: string;
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

  // Override saison pour tester sur plan Free (2022-2024).
  // Body : { "season": 2024 }
  let bodyOverride: { season?: number } = {};
  if (req.method === 'POST') {
    try {
      bodyOverride = await req.json();
    } catch {
      // ignore
    }
  }
  const overrideSeason = bodyOverride.season;

  let totalUpserted = 0;
  const errors: string[] = [];

  for (const league of TRACKED_LEAGUES) {
    // Essaye d'abord la season nominale, puis fallback sur la précédente
    // si l'API renvoie 0 standings (cas Portugal/Turquie/Conference qui
    // sont en saison 2025-26 alors qu'on hardcode 2026 partout).
    const seasonsToTry = overrideSeason
      ? [overrideSeason]
      : [league.season, league.season - 1];
    let allTeams: StandingTeam[] = [];
    let seasonUsed = seasonsToTry[0];
    try {
      for (const trySeason of seasonsToTry) {
        const url = `${API_BASE}/standings?league=${league.id}&season=${trySeason}`;
        const res = await fetch(url, {
          headers: { 'x-apisports-key': apiKey },
        });
        if (!res.ok) {
          errors.push(`league=${league.id} season=${trySeason}: HTTP ${res.status}`);
          continue;
        }
        const data = await res.json();
        const responses = data.response ?? [];
        const collected: StandingTeam[] = [];
        // Set pour dédupliquer : on garde la PREMIÈRE occurrence d'une équipe,
        // qui correspond toujours à son groupe réel. Les pseudo-groupes
        // type "Ranking of third-placed teams" (Coupe du Monde 2026) ré-écraseraient
        // sinon le vrai groupe via l'upsert (api_team_id, api_league_id, season).
        const seenTeamIds = new Set<number>();
        for (const r of responses) {
          const groups = r.league?.standings ?? [];
          // Si l'API renvoie plusieurs groupes (Coupe du Monde, Euro...),
          // on stocke le nom du groupe sur chaque équipe pour pouvoir
          // afficher les classements par groupe côté app. Quand chaque
          // team a déjà un champ `group` (cas tournoi), on le garde tel
          // quel ; sinon (championnat classique avec 1 seul "groupe")
          // on hérite du nom de la ligue.
          for (const g of groups) {
            for (const team of g) {
              if (seenTeamIds.has(team.team.id)) continue;
              seenTeamIds.add(team.team.id);
              if (!team.group && r.league?.name) {
                team.group = r.league.name;
              }
              collected.push(team);
            }
          }
        }
        if (collected.length > 0) {
          allTeams = collected;
          seasonUsed = trySeason;
          break;
        }
      }
      if (allTeams.length === 0) continue;
      const seasonToUse = seasonUsed;

      for (const t of allTeams) {
        const { error } = await supabase.from('team_stats').upsert(
          {
            api_team_id: t.team.id,
            api_league_id: league.id,
            season: seasonToUse,
            team_name: t.team.name,
            team_logo: t.team.logo,
            form: t.form ?? null,
            played: t.all.played,
            wins: t.all.win,
            draws: t.all.draw,
            losses: t.all.lose,
            goals_for: t.all.goals.for,
            goals_against: t.all.goals.against,
            standing_rank: t.rank,
            standing_points: t.points,
            standing_group: t.group ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'api_team_id,api_league_id,season' },
        );
        if (error) {
          errors.push(`team ${t.team.id}: ${error.message}`);
        } else {
          totalUpserted++;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      errors.push(`league=${league.id}: ${msg}`);
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      upserted: totalUpserted,
      errors,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
