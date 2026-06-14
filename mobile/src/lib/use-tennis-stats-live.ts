// AJ Pronos — Hook : useTennisStatsLive
//
// Fetch les vraies stats tennis d'un match depuis la DB pour alimenter le
// Stats Center (TennisStatsBody). Remplace progressivement le mock
// fake-tennis-stats : si la DB répond, on l'utilise ; sinon on retombe sur
// les éventuelles fake stats pré-chargées dans le prono.
//
// Données récupérées :
//   - Le match courant (pour la surface du tournoi)
//   - Le profil des 2 joueurs (tennis_players, avec stats agrégées par surface)
//   - Les 30 derniers matchs joués par chaque joueur (Forme)
//   - Les confrontations directes (H2H)

import { useEffect, useState } from 'react';

import { supabase } from './supabase';
import type {
  CurrentTournament,
  PlayerProfile,
  TennisMatch,
  TennisStats,
  TennisSurface,
} from '@/types/tennis-stats';

// Mapping DB → type front
function dbSurfaceToFront(
  s: string | null | undefined,
): TennisSurface {
  if (s === 'clay') return 'terre';
  if (s === 'grass') return 'gazon';
  return 'dur'; // hard, hard_indoor, carpet → "dur" (regroupement simplificateur)
}

function ageFromBirthday(bday: string | null): number | null {
  if (!bday) return null;
  const birth = new Date(bday);
  if (Number.isNaN(birth.getTime())) return null;
  const ageMs = Date.now() - birth.getTime();
  return Math.floor(ageMs / (365.25 * 24 * 3600 * 1000));
}

function handednessFr(
  h: 'left' | 'right' | 'ambidextrous' | null,
): 'gauche' | 'droite' | null {
  if (h === 'left') return 'gauche';
  if (h === 'right') return 'droite';
  return null;
}

type DbPlayer = {
  api_player_key: string;
  full_name: string | null;
  name: string;
  country: string | null;
  ranking: number | null;
  handedness: 'left' | 'right' | 'ambidextrous' | null;
  height_cm: number | null;
  turned_pro_year: number | null;
  birthday: string | null;
  career_titles: number | null;
  career_win_rate: number | null;
  career_hard_win_rate: number | null;
  career_clay_win_rate: number | null;
  career_grass_win_rate: number | null;
  season_titles: number | null;
  season_win_rate: number | null;
  season_hard_win_rate: number | null;
  season_clay_win_rate: number | null;
  season_grass_win_rate: number | null;
};

type DbMatch = {
  match_start_at: string;
  competition_label: string;
  surface: string | null;
  team_home: string;
  team_away: string;
  team_home_api_id: number | null;
  team_away_api_id: number | null;
  score_home: number | null;
  score_away: number | null;
  winner_side: 'home' | 'away' | null;
};

function profileFromDb(p: DbPlayer, currentSurface: TennisSurface): PlayerProfile {
  const surfaceWin = (() => {
    if (currentSurface === 'terre') return p.career_clay_win_rate;
    if (currentSurface === 'gazon') return p.career_grass_win_rate;
    return p.career_hard_win_rate;
  })();
  const seasonSurfaceWin = (() => {
    if (currentSurface === 'terre') return p.season_clay_win_rate;
    if (currentSurface === 'gazon') return p.season_grass_win_rate;
    return p.season_hard_win_rate;
  })();
  return {
    fullName: p.full_name || p.name,
    flag: undefined, // Drapeau via country plus tard (mapping ISO)
    age: ageFromBirthday(p.birthday),
    rankingAtp: p.ranking ?? null,
    rankingRace: null, // Pas dans API tennis (cf. doc d'audit)
    handedness: handednessFr(p.handedness),
    heightCm: p.height_cm ?? null,
    turnedProYear: p.turned_pro_year ?? null,
    seasonWinRate: Math.round(p.season_win_rate ?? 0),
    seasonSurfaceWinRate: Math.round(seasonSurfaceWin ?? 0),
    seasonTitles: p.season_titles ?? 0,
    careerWinRate: Math.round(p.career_win_rate ?? 0),
    careerSurfaceWinRate: Math.round(surfaceWin ?? 0),
    careerTitles: p.career_titles ?? 0,
  };
}

function matchFromDb(
  m: DbMatch,
  forPlayerApiKey: number,
): TennisMatch {
  // Calcule l'adversaire et le score POV de ce joueur
  const isHome = m.team_home_api_id === forPlayerApiKey;
  const opponent = isHome ? m.team_away : m.team_home;
  const myScore = isHome ? m.score_home : m.score_away;
  const oppScore = isHome ? m.score_away : m.score_home;
  const won = isHome ? m.winner_side === 'home' : m.winner_side === 'away';
  const d = new Date(m.match_start_at);
  const dateLabel = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.`;
  return {
    date: dateLabel,
    tournament: m.competition_label,
    surface: dbSurfaceToFront(m.surface),
    opponent,
    scoreSets: `${myScore ?? 0}-${oppScore ?? 0}`,
    result: won ? 'V' : 'D',
  };
}

type UseTennisStatsLiveResult = {
  stats: TennisStats | null;
  isLoading: boolean;
};

export function useTennisStatsLive(
  apiFixtureId: number | null | undefined,
): UseTennisStatsLiveResult {
  const [stats, setStats] = useState<TennisStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiFixtureId) {
        setStats(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      // 1) Match courant
      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('api_fixture_id', apiFixtureId)
        .eq('sport', 'tennis')
        .single();
      if (cancelled) return;
      if (!match || !match.team_home_api_id || !match.team_away_api_id) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      const homeKey = match.team_home_api_id;
      const awayKey = match.team_away_api_id;
      const surface = dbSurfaceToFront(match.surface);

      // 2) Profils joueurs (parallel)
      const [playersRes, homeMatchesRes, awayMatchesRes, h2hRes] = await Promise.all([
        supabase
          .from('tennis_players')
          .select(
            'api_player_key, full_name, name, country, ranking, handedness, height_cm, turned_pro_year, birthday, ' +
              'career_titles, career_win_rate, career_hard_win_rate, career_clay_win_rate, career_grass_win_rate, ' +
              'season_titles, season_win_rate, season_hard_win_rate, season_clay_win_rate, season_grass_win_rate',
          )
          .in('api_player_key', [String(homeKey), String(awayKey)]),
        supabase
          .from('matches')
          .select('match_start_at, competition_label, surface, team_home, team_away, team_home_api_id, team_away_api_id, score_home, score_away, winner_side')
          .eq('sport', 'tennis')
          .eq('status', 'finished')
          .or(`team_home_api_id.eq.${homeKey},team_away_api_id.eq.${homeKey}`)
          .order('match_start_at', { ascending: false })
          .limit(30),
        supabase
          .from('matches')
          .select('match_start_at, competition_label, surface, team_home, team_away, team_home_api_id, team_away_api_id, score_home, score_away, winner_side')
          .eq('sport', 'tennis')
          .eq('status', 'finished')
          .or(`team_home_api_id.eq.${awayKey},team_away_api_id.eq.${awayKey}`)
          .order('match_start_at', { ascending: false })
          .limit(30),
        supabase
          .from('matches')
          .select('match_start_at, competition_label, surface, team_home, team_away, team_home_api_id, team_away_api_id, score_home, score_away, winner_side')
          .eq('sport', 'tennis')
          .eq('status', 'finished')
          .or(
            `and(team_home_api_id.eq.${homeKey},team_away_api_id.eq.${awayKey}),and(team_home_api_id.eq.${awayKey},team_away_api_id.eq.${homeKey})`,
          )
          .order('match_start_at', { ascending: false })
          .limit(10),
      ]);
      if (cancelled) return;

      const players = (playersRes.data ?? []) as unknown as DbPlayer[];
      const home = players.find((p) => p.api_player_key === String(homeKey));
      const away = players.find((p) => p.api_player_key === String(awayKey));
      if (!home || !away) {
        setStats(null);
        setIsLoading(false);
        return;
      }

      const tournament: CurrentTournament = {
        name: match.competition_label,
        surface,
      };

      const composed: TennisStats = {
        tournament,
        homeProfile: profileFromDb(home, surface),
        awayProfile: profileFromDb(away, surface),
        homeMatches: ((homeMatchesRes.data ?? []) as DbMatch[]).map((m) =>
          matchFromDb(m, homeKey),
        ),
        awayMatches: ((awayMatchesRes.data ?? []) as DbMatch[]).map((m) =>
          matchFromDb(m, awayKey),
        ),
        h2hMatches: ((h2hRes.data ?? []) as DbMatch[]).map((m) =>
          matchFromDb(m, homeKey),
        ),
      };

      setStats(composed);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [apiFixtureId]);

  return { stats, isLoading };
}
