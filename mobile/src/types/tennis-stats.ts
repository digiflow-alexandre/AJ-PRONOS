/**
 * Types pour le Stats Center tennis.
 * Mockés en fixtures pour le MVP — branchés sur API tennis plus tard.
 */

export type TennisSurface = 'dur' | 'terre' | 'gazon';

/**
 * Profil d'un joueur de tennis.
 * Affiché dans l'onglet "Profil" du Stats Center.
 */
export type PlayerProfile = {
  fullName: string;
  flag?: string;             // URL drapeau pays
  // Bio
  age: number | null;
  rankingAtp: number | null;
  rankingRace: number | null;
  handedness: 'gauche' | 'droite' | null;
  heightCm: number | null;
  turnedProYear: number | null;
  // Saison (année en cours)
  seasonWinRate: number;          // % global
  seasonSurfaceWinRate: number;   // % sur la surface du tournoi en cours
  seasonTitles: number;
  // Carrière
  careerWinRate: number;
  careerSurfaceWinRate: number;
  careerTitles: number;
};

/**
 * Résultat d'un match récent au tennis.
 * V = victoire, D = défaite (pas de nul au tennis).
 */
export type TennisMatchOutcome = 'V' | 'D';

export type TennisMatch = {
  date: string;             // "15.05."
  tournament: string;       // "ATP Rome"
  tournamentFlag?: string;  // URL drapeau pays du tournoi
  surface: TennisSurface;
  opponent: string;         // "Zverev"
  opponentFlag?: string;
  /** Score affiché en sets — ex "3-1", "2-0", "3-2". POV du joueur principal. */
  scoreSets: string;
  result: TennisMatchOutcome;
};

/**
 * Tournoi en cours (utilisé pour adapter les stats à la surface).
 */
export type CurrentTournament = {
  name: string;
  surface: TennisSurface;
};

/**
 * Stats fines de service / retour / points d'un joueur sur un match.
 * Source : matches.tennis_statistics (statistics[] API api-tennis.com,
 * filtré sur stat_period='match' pour ce joueur uniquement).
 * Tous les champs sont nullable car l'API ne retourne pas toujours tout.
 */
export type TennisMatchFineStats = {
  /** Contexte du match d'où viennent ces stats */
  opponent: string;
  /** Date affichée ("15.05.") */
  date: string;
  /** Score sets POV du joueur ("3-1") */
  scoreSets: string;
  result: TennisMatchOutcome;
  // Service
  aces: number | null;
  doubleFaults: number | null;
  firstServePct: number | null;       // %
  firstServePointsWon: number | null; // %
  secondServePointsWon: number | null;// %
  breakPointsSaved: { won: number; total: number } | null;
  // Retour
  breakPointsConverted: { won: number; total: number } | null;
  // Points / jeu
  winners: number | null;
  unforcedErrors: number | null;
  totalPointsWon: number | null;      // %
};

/**
 * Stats complètes attachées à un prono tennis (selection ou simple).
 */
export type TennisStats = {
  tournament: CurrentTournament;
  /** competition_id du tournoi en DB (= tournament_key API-Tennis).
   *  Permet à l'onglet Bracket de fetch tous les matchs du tournoi. */
  competitionId?: string;
  homeProfile: PlayerProfile;
  awayProfile: PlayerProfile;
  /** 30 derniers matchs du joueur domicile (pour permettre filtre par surface). */
  homeMatches: TennisMatch[];
  awayMatches: TennisMatch[];
  /** Confrontations directes (max 10). */
  h2hMatches: TennisMatch[];
  /** Stats fines du dernier match terminé du joueur domicile (null si pas dispo) */
  homeLastMatchStats?: TennisMatchFineStats | null;
  awayLastMatchStats?: TennisMatchFineStats | null;
  // L'onglet Tableau (bracket) viendra plus tard
};
