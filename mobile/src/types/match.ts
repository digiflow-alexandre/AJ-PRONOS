/**
 * Type DB pour la table `matches` (cache des fixtures depuis API-Football).
 * Peuplée par l'Edge Function `fetch-matches` (cron quotidien).
 */

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';

export type TennisSurface = 'hard' | 'clay' | 'grass' | 'hard_indoor' | 'carpet';

export type MatchRow = {
  id: string;
  api_fixture_id: number;
  /** Nullable depuis migration 023 (le tennis n'utilise pas ce concept). */
  api_league_id: number | null;
  competition_id: string;
  competition_label: string;
  competition_round: string | null;
  competition_etape: string | null;
  sport: 'foot' | 'tennis';
  season: number;
  team_home: string;
  team_home_api_id: number | null;
  team_home_logo: string | null;
  team_away: string;
  team_away_api_id: number | null;
  team_away_logo: string | null;
  match_start_at: string;
  venue_name: string | null;
  venue_city: string | null;
  status: MatchStatus;
  status_short: string | null;
  score_home: number | null;
  score_away: number | null;
  /** Tennis uniquement (migration 023). */
  surface: TennisSurface | null;
  round: string | null;
  is_doubles: boolean | null;
  sets_detail: Array<{ score_first: string; score_second: string; score_set: string }> | null;
  winner_side: 'home' | 'away' | null;
  tennis_statistics: unknown[] | null;
  created_at: string;
  updated_at: string;
};

export type TeamStatsRow = {
  id: string;
  api_team_id: number;
  api_league_id: number;
  season: number;
  team_name: string;
  team_logo: string | null;
  /** Forme récente — string des 5 derniers résultats ex "WWLDW". */
  form: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  standing_rank: number | null;
  standing_points: number | null;
  updated_at: string;
};
