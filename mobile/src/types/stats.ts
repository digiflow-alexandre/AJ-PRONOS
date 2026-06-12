/**
 * Types pour le Stats Center (sheet de stats détaillées sur la fiche prono).
 * Mockés en fixtures pour le MVP — branchés sur API-Football plus tard.
 */

export type MatchOutcome = 'V' | 'N' | 'D';

/** Un match passé d'une équipe (forme récente ou H2H). */
export type RecentMatch = {
  date: string;        // format court "17.05."
  opponent: string;
  opponentLogo?: string;
  scoreHome: number;
  scoreAway: number;
  /** L'équipe principale (celle à qui appartient cet objet) jouait à domicile ? */
  isHome: boolean;
  /** Résultat du POV de l'équipe principale. */
  result: MatchOutcome;
};

/** Stats agrégées saison (utilisées dans l'onglet Saison). */
export type SeasonStats = {
  /** Label de la compétition utilisée pour ces stats (ex: "Ligue 1"). */
  competition: string;
  goalsForPerMatch: number;        // ex 2.8
  goalsAgainstPerMatch: number;    // ex 1.4
  possessionPct: number;           // ex 58 (en %)
  shotsPerMatch: number;
  shotsOnTargetPerMatch: number;
  cornersPerMatch: number;
  freeKicksPerMatch: number;
  chancesPerMatch: number;
  cleanSheets: number;
  yellowCards: number;
  redCards: number;
};

/** Ligne d'une équipe dans le tableau de classement. */
export type StandingRow = {
  position: number;
  team: string;
  teamLogo?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  /** Nom du groupe (ex "Group A") pour les tournois. Null pour les
   * championnats classiques (= un seul groupe global). */
  group?: string | null;
};

/** Données stats complètes attachées à un prono pour le Stats Center. */
export type ProNoStats = {
  /** 10 derniers matchs de l'équipe à domicile. */
  homeRecentMatches: RecentMatch[];
  /** 10 derniers matchs de l'équipe visiteuse. */
  awayRecentMatches: RecentMatch[];
  /** 10 dernières confrontations directes. Score POV équipe domicile. */
  h2hMatches: RecentMatch[];

  homeSeasonStats: SeasonStats;
  awaySeasonStats: SeasonStats;

  /** Position des 2 équipes dans le classement (raccourci pour badge hero). */
  homePosition: number;
  awayPosition: number;

  /** Extrait du classement (5-6 lignes centrées sur les 2 équipes). */
  standings: StandingRow[];
  standingsLabel: string;  // "Classement Ligue 1" / "Classement ATP" etc.
};
