/**
 * Carnet personnel — un user_bet représente un pari AJ Pronos que
 * l'utilisateur a marqué comme "joué" sur son propre bookmaker.
 */

export type UserBetType = 'single' | 'combo';

/**
 * Snapshot des infos importantes du pari au moment où l'user l'a marqué.
 * Permet d'afficher le carnet même si le bet sous-jacent est supprimé.
 */
export type UserBetSnapshot = {
  // Métadonnées affichage
  title: string;       // ex: "PSG - Lyon" ou "Combiné 3 sélections"
  /** Pour un single = "foot" / "tennis".
   *  Pour un combo = "foot" si 100% foot, "tennis" si 100% tennis,
   *  "mixed" si combo mixte. Sert au choix du background des cards. */
  sport?: 'foot' | 'tennis' | 'mixed';
  competition?: string; // ex: "Ligue 1 · J32"
  // Données quantitatives utilisées pour calculer le ROI
  odd: number;         // cote au moment de la pose (single = odd, combo = combinationOdd)
  result: 'pending' | 'live' | 'win' | 'loss' | 'void';
  matchStartAt: string; // ISO date
};

export type UserBet = {
  id: string;
  user_id: string;
  bet_id: string;
  bet_type: UserBetType;
  bet_snapshot: UserBetSnapshot;
  played_at: string;
  stake: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
