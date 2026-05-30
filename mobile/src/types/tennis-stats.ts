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
 * Stats complètes attachées à un prono tennis (selection ou simple).
 */
export type TennisStats = {
  tournament: CurrentTournament;
  homeProfile: PlayerProfile;
  awayProfile: PlayerProfile;
  /** 30 derniers matchs du joueur domicile (pour permettre filtre par surface). */
  homeMatches: TennisMatch[];
  awayMatches: TennisMatch[];
  /** Confrontations directes (max 10). */
  h2hMatches: TennisMatch[];
  // L'onglet Tableau (bracket) viendra plus tard
};
