// AJ Pronos — Parseurs tennis pour track-results
//
// Implémente l'évaluation auto des 7 marchés tennis supportés :
//   1) Vainqueur match            ex : "Alcaraz" / "Alcaraz gagne"
//   2) Vainqueur en N sets        ex : "Alcaraz en 2 sets" / "Sinner en 3 sets"
//   3) Vainqueur d'un set précis  ex : "Set 1 Djokovic" / "1er set Sinner"
//   4) Total jeux over/under      ex : "+22.5 jeux" / "moins de 22.5 jeux"
//   5) Tie-break oui/non          ex : "Tie-break oui" / "TB non"
//   6) Score exact en sets        ex : "2-0" / "2-1"
//   7) Combiné de plusieurs       géré nativement (1 selection = 1 marché)
//
// Toute prédiction qui ne match aucun pattern → retourne 'void' (= "à valider
// manuellement", remonté à l'admin via push notification).

export type TennisMatchForEval = {
  status: string;
  winner_side: 'home' | 'away' | null;
  score_home: number | null;
  score_away: number | null;
  sets_detail: Array<{ score_first: string; score_second: string; score_set: string }> | null;
};

export type BetEvalResult = 'win' | 'loss' | 'void';

// ============================================================
// Helpers de normalisation
// ============================================================

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalize(s: string): string {
  return stripAccents(s.toLowerCase()).replace(/\s+/g, ' ').trim();
}

/**
 * Extrait les "alias" matchables d'un nom de joueur tennis.
 * "C. Alcaraz" → ["c alcaraz", "alcaraz"]
 * "Carlos Alcaraz" → ["carlos alcaraz", "alcaraz"]
 * "Cervantes Tomas/ Ferrer Adria" (paire double) → ["cervantes", "ferrer"]
 */
function nameAliases(fullName: string): string[] {
  const norm = normalize(fullName);
  if (norm.includes('/')) {
    // Paire de double : split sur "/" et extrait le 1er mot de chaque côté
    return norm.split('/').map((side) => side.trim().split(' ')[0]).filter(Boolean);
  }
  // Singles : "n. djokovic" ou "novak djokovic"
  const parts = norm.split(' ').filter(Boolean);
  const aliases = new Set<string>();
  aliases.add(norm);
  // Last name only (souvent suffisant)
  if (parts.length > 0) aliases.add(parts[parts.length - 1]);
  return Array.from(aliases);
}

/**
 * Cherche dans la prédiction laquelle des 2 équipes (home/away) est mentionnée.
 * Retourne 'home', 'away' ou 'unknown'.
 */
function detectPlayerSide(
  prediction: string,
  teamHome: string,
  teamAway: string,
): 'home' | 'away' | 'unknown' {
  const pred = normalize(prediction);
  const homeAliases = nameAliases(teamHome);
  const awayAliases = nameAliases(teamAway);
  const homeMatch = homeAliases.some((a) => pred.includes(a));
  const awayMatch = awayAliases.some((a) => pred.includes(a));
  // Ambigu si les 2 matchent (ex: 2 frères même nom) → on retourne unknown
  if (homeMatch && awayMatch) return 'unknown';
  if (homeMatch) return 'home';
  if (awayMatch) return 'away';
  return 'unknown';
}

function totalGamesFromSets(
  sets: Array<{ score_first: string; score_second: string }> | null,
): number {
  if (!sets) return 0;
  return sets.reduce((acc, s) => {
    const f = parseInt(s.score_first, 10);
    const sc = parseInt(s.score_second, 10);
    return acc + (Number.isFinite(f) ? f : 0) + (Number.isFinite(sc) ? sc : 0);
  }, 0);
}

function hasTieBreak(
  sets: Array<{ score_first: string; score_second: string }> | null,
): boolean {
  if (!sets) return false;
  return sets.some((s) => {
    const f = parseInt(s.score_first, 10);
    const sc = parseInt(s.score_second, 10);
    return (f === 7 && sc === 6) || (f === 6 && sc === 7);
  });
}

// ============================================================
// Évaluateur principal
// ============================================================

export function evaluateTennisBet(
  prediction: string,
  teamHome: string,
  teamAway: string,
  match: TennisMatchForEval,
): BetEvalResult {
  // Match annulé / walkover → void (= remboursé)
  if (match.status === 'cancelled') return 'void';
  // Match pas encore fini → ne devrait pas arriver, mais on est safe
  if (match.status !== 'finished') return 'void';
  if (match.winner_side == null) return 'void';
  if (match.score_home == null || match.score_away == null) return 'void';

  const pred = normalize(prediction);
  const sets = match.sets_detail ?? [];

  // 1) SCORE EXACT EN SETS : "2-0" / "2-1" / "1-2"
  //    (test en premier car format très spécifique)
  const exactScore = pred.match(/^(\d)\s*[-:\/]\s*(\d)$/);
  if (exactScore) {
    const h = parseInt(exactScore[1], 10);
    const a = parseInt(exactScore[2], 10);
    return match.score_home === h && match.score_away === a ? 'win' : 'loss';
  }

  // 2) VAINQUEUR EN N SETS : "Alcaraz en 2 sets" / "Sinner remporte en 3 sets"
  const inNSets = pred.match(/en\s+(\d)\s*sets?/);
  if (inNSets) {
    const targetSets = parseInt(inNSets[1], 10);
    const totalSets = match.score_home + match.score_away;
    const side = detectPlayerSide(prediction, teamHome, teamAway);
    if (side === 'unknown') return 'void';
    return match.winner_side === side && totalSets === targetSets ? 'win' : 'loss';
  }

  // 3) VAINQUEUR D'UN SET PRÉCIS : "Set 1 Sinner" / "1er set Djokovic"
  const setWinner = pred.match(
    /(?:^|\s)(?:set\s+(\d+)|(\d+)\s*(?:er|eme|e|ème))(?:\s+set)?\s+(.+)$/,
  );
  if (setWinner) {
    const setNum = parseInt(setWinner[1] || setWinner[2], 10);
    const playerHint = setWinner[3];
    if (sets.length < setNum) return 'void';
    const set = sets[setNum - 1];
    const f = parseInt(set.score_first, 10);
    const sc = parseInt(set.score_second, 10);
    if (!Number.isFinite(f) || !Number.isFinite(sc) || f === sc) return 'void';
    const homeWonSet = f > sc;
    const side = detectPlayerSide(playerHint, teamHome, teamAway);
    if (side === 'unknown') return 'void';
    const sideWonSet = homeWonSet ? 'home' : 'away';
    return sideWonSet === side ? 'win' : 'loss';
  }

  // 4) TOTAL JEUX OVER/UNDER : "+22.5 jeux" / "moins de 22.5 jeux"
  //    Détecte aussi "over/under" en anglais.
  const totalGamesPattern = pred.match(
    /(\+|plus de|over|sup(?:erieur)?(?:\s+a)?|>=?\s?|moins de|under|inf(?:erieur)?(?:\s+a)?|<=?\s?|-)\s*(\d+(?:[.,]\d+)?)\s*(?:jeux|games?)/,
  );
  if (totalGamesPattern) {
    const directionToken = totalGamesPattern[1];
    const thresholdStr = totalGamesPattern[2].replace(',', '.');
    const threshold = parseFloat(thresholdStr);
    const over = /^(\+|plus|over|sup|>)/i.test(directionToken.trim());
    const totalGames = totalGamesFromSets(sets);
    return (over ? totalGames > threshold : totalGames < threshold) ? 'win' : 'loss';
  }

  // 5) TIE-BREAK OUI/NON
  if (
    pred.includes('tie-break') ||
    pred.includes('tie break') ||
    pred.match(/\btb\b/)
  ) {
    const tb = hasTieBreak(sets);
    if (pred.includes('oui') || pred.includes('yes')) return tb ? 'win' : 'loss';
    if (pred.includes('non') || pred.includes('no')) return !tb ? 'win' : 'loss';
    return 'void';
  }

  // 6) VAINQUEUR MATCH (fallback : juste un nom de joueur)
  const side = detectPlayerSide(prediction, teamHome, teamAway);
  if (side === 'unknown') return 'void';
  return match.winner_side === side ? 'win' : 'loss';
}

// Exports utiles aux tests éventuels
export const _internal = { nameAliases, detectPlayerSide, totalGamesFromSets, hasTieBreak };
