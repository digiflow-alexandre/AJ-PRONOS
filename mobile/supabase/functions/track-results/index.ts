// AJ Pronos — Edge Function : track-results
//
// Check les matchs en LIVE ou récemment finis, met à jour le statut + score
// dans la table `matches`, puis pour chaque prono publié lié à un match
// terminé :
//   - Calcule le résultat (win/loss/void) selon la prédiction texte de Julien
//   - Update le résultat dans `published_bets`
//   - Envoie une notif push à tous les abonnés concernés (selon tier + prefs)
//
// Cron recommandé : '*/10 18-23 * * *' (toutes les 10 min de 18h à 23h UTC)
//
// Quota : ~3-5 calls par run (fixtures live + 1 ou 2 lookups). À 36 runs/jour
// max → 100-180 calls/jour. OK avec plan Pro 7500. NON viable sur Free 100.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const API_BASE = 'https://v3.football.api-sports.io';
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type ApiFixture = {
  fixture: {
    id: number;
    status: { short: string; long: string };
  };
  goals: { home: number | null; away: number | null };
  score?: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
};

type ApiEvent = {
  time: { elapsed: number };
  team: { id: number; name: string };
  player: { id: number | null; name: string | null };
  assist?: { id: number | null; name: string | null };
  type: 'Goal' | 'Card' | 'subst' | 'Var';
  detail: string;
  comments?: string | null;
};

type ApiStat = {
  team: { id: number; name: string };
  statistics: Array<{ type: string; value: number | string | null }>;
};

type Scorer = {
  player: string;
  team: 'home' | 'away';
  minute: number;
  type: 'normal' | 'penalty' | 'owngoal';
};

type MatchContext = {
  scoreHome: number;
  scoreAway: number;
  scoreHomeHT: number;
  scoreAwayHT: number;
  scorers: Scorer[];
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
  corners: { home: number; away: number };
  shotsOnTarget: { home: number; away: number };
  possession: { home: number; away: number };
  penaltyScored: boolean;
  penaltyMissed: boolean;
  ownGoal: boolean;
};

function mapStatus(short: string): 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled' {
  if (['NS', 'TBD'].includes(short)) return 'scheduled';
  if (['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(short)) return 'live';
  if (['FT', 'AET', 'PEN', 'AWD', 'WO'].includes(short)) return 'finished';
  if (short === 'PST') return 'postponed';
  if (['CANC', 'ABD'].includes(short)) return 'cancelled';
  return 'scheduled';
}

/** Normalise un nom d'équipe pour matching tolérant (accents, ponctuation). */
function normTeam(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,'’\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Table FR→EN des noms de nations (foot international).
 * L'API-Football renvoie les équipes nationales en anglais ("Mexico",
 * "South Africa", "Germany"...). Les admins saisissent en français
 * ("Mexique", "Afrique du Sud", "Allemagne"...). On expose une fonction
 * qui réécrit la prédiction en remplaçant les noms FR par leur équivalent EN
 * pour matcher l'équipe API.
 */
const NATION_FR_TO_EN_NORM: Record<string, string> = {
  'allemagne': 'germany',
  'angleterre': 'england',
  'autriche': 'austria',
  'belgique': 'belgium',
  'bresil': 'brazil',
  'croatie': 'croatia',
  'danemark': 'denmark',
  'ecosse': 'scotland',
  'egypte': 'egypt',
  'espagne': 'spain',
  'etats unis': 'united states',
  'finlande': 'finland',
  'grece': 'greece',
  'hongrie': 'hungary',
  'irlande': 'ireland',
  'islande': 'iceland',
  'italie': 'italy',
  'japon': 'japan',
  'maroc': 'morocco',
  'mexique': 'mexico',
  'nigeria': 'nigeria',
  'norvege': 'norway',
  'pays bas': 'netherlands',
  'pologne': 'poland',
  'portugal': 'portugal',
  'roumanie': 'romania',
  'senegal': 'senegal',
  'suede': 'sweden',
  'suisse': 'switzerland',
  'tunisie': 'tunisia',
  'turquie': 'turkey',
  'ukraine': 'ukraine',
  'pays de galles': 'wales',
  'arabie saoudite': 'saudi arabia',
  'coree du sud': 'south korea',
  'cote d ivoire': 'ivory coast',
  'afrique du sud': 'south africa',
  'australie': 'australia',
  'cameroun': 'cameroon',
  'canada': 'canada',
  'colombie': 'colombia',
  'argentine': 'argentina',
  'chili': 'chile',
  'perou': 'peru',
  'uruguay': 'uruguay',
  'paraguay': 'paraguay',
  'equateur': 'ecuador',
  'venezuela': 'venezuela',
  'bolivie': 'bolivia',
  'serbie': 'serbia',
  'pologne': 'poland',
  'republique tcheque': 'czech republic',
  'tchequie': 'czech republic',
  'slovaquie': 'slovakia',
  'slovenie': 'slovenia',
  'algerie': 'algeria',
  'ghana': 'ghana',
  'kenya': 'kenya',
  'rwanda': 'rwanda',
  'qatar': 'qatar',
  'iran': 'iran',
  'irak': 'iraq',
  'jordanie': 'jordan',
  'chine': 'china',
  'inde': 'india',
  'thailande': 'thailand',
  'philippines': 'philippines',
  'indonesie': 'indonesia',
  'vietnam': 'vietnam',
  'nouvelle zelande': 'new zealand',
  'fidji': 'fiji',
};

/**
 * Substitue les noms de nations FR par leur équivalent EN dans une
 * prédiction normalisée. "mexique gagne" -> "mexico gagne".
 * Permet ensuite à teamMatchesInPrediction de matcher l'API.
 */
function translateNationsToEn(predictionNorm: string): string {
  let result = predictionNorm;
  for (const [fr, en] of Object.entries(NATION_FR_TO_EN_NORM)) {
    // Remplacement avec boundary word pour pas casser "guinee equatoriale" si "guinee" est dans la map
    const re = new RegExp(`\\b${fr}\\b`, 'g');
    result = result.replace(re, en);
  }
  return result;
}

/**
 * Match tolérant entre un fragment de prédiction (genre "Gutierrez") et
 * un nom de joueur API-Football (genre "L. Gutierrez" ou "Luis Carlos").
 * On regarde l'inclusion dans les 2 sens après normalisation.
 */
function playerMatchesInText(prediction: string, scorerName: string | null): boolean {
  if (!scorerName) return false;
  const p = normTeam(prediction);
  const s = normTeam(scorerName);
  if (!p || !s) return false;
  if (p.includes(s) || s.includes(p)) return true;
  // Split sur les espaces : on accepte un match sur n'importe quel mot du nom
  // (utile quand l'API renvoie "L. Gutierrez" et Alex tape "gutierrez").
  const scorerWords = s.split(' ').filter((w) => w.length >= 3);
  return scorerWords.some((w) => p.includes(w));
}

/** "PSG" matche "Paris Saint Germain" ? (inclusion ou initiales). */
function teamMatchesInPrediction(predictionNorm: string, teamNorm: string): boolean {
  if (!teamNorm) return false;
  if (predictionNorm.includes(teamNorm)) return true;
  // Initiales : PSG vs Paris Saint Germain
  const tokens = teamNorm.split(' ').filter((w) => w.length >= 2);
  if (tokens.length >= 2) {
    const initials = tokens.map((t) => t[0]).join('');
    if (initials.length >= 2 && predictionNorm.includes(initials)) return true;
  }
  return false;
}

/**
 * Calcule le résultat d'un pari (win/loss/void).
 *
 * Gère les paris composés type "Mon Match" Winamax où une prédiction
 * unique combine plusieurs conditions sur le même match :
 *   "Mexique et moins de 4,5 buts"
 *   "PSG gagne & BTTS oui"
 *   "+ de 2.5 buts et BTTS oui"
 *
 * Séparateurs reconnus : " et ", " & ".
 * (Pas "+" pour éviter la collision avec les handicaps "+1.5" et les
 *  "over" notés "+2.5". Pas "ou" / "/" / "|" qui sont des doubles chances.)
 *
 * Logique : AND. Toutes les sous-conditions doivent être gagnantes pour
 * que le pari soit gagné. Si une est perdue → pari perdu. Si une est
 * void (non parsable) → pari void (Julien tranche).
 */
function evaluateBet(
  prediction: string,
  teamHome: string,
  teamAway: string,
  ctx: MatchContext,
): 'win' | 'loss' | 'void' {
  // Split sur les séparateurs AND (insensible à la casse).
  // Garde-fou : on ne split QUE si on trouve un séparateur, sinon la
  // logique atomique d'origine s'applique directement.
  const parts = prediction
    .split(/\s+(?:et|&)\s+/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  if (parts.length <= 1) {
    return evaluateAtomicBet(prediction, teamHome, teamAway, ctx);
  }

  let hasVoid = false;
  for (const part of parts) {
    const r = evaluateAtomicBet(part, teamHome, teamAway, ctx);
    if (r === 'loss') return 'loss'; // un seul échec = pari perdu
    if (r === 'void') hasVoid = true; // on note mais on continue
  }
  // Toutes les parties évaluées : si aucune n'est void → win, sinon void.
  return hasVoid ? 'void' : 'win';
}

/**
 * Calcule le résultat d'un pari ATOMIQUE (une seule condition).
 *
 * Prédictions reconnues (parser étendu V2 — 2026-06-06) :
 *  1. Vainqueur — "PSG", "Victoire Lille", "Lille gagne"
 *  2. Match nul — "Match nul", "Nul"
 *  3. Plus/Moins de X buts — "Plus de 2.5 buts", "Moins de 1.5"
 *  4. BTTS — "Les deux équipes marquent", "BTTS", "BTTS oui"
 *  5. BTTS NON — "Une équipe ne marque pas", "BTTS non"
 *  6. Double chance — "PSG ou nul", "Nul ou Lille", "Lille ou Nice"
 *  7. Handicap européen — "PSG (-1)", "Lille (+1)"
 *  8. Handicap asiatique — "PSG (-0.5)" = victoire, "PSG (-1.5)" = gagner par 2+
 *  9. Score exact — "2-1", "1-1", "PSG 2-1"
 *  10. Total buts exact — "2 buts dans le match", "3 buts"
 *
 *  Toute autre prediction → 'void' (Julien valide manuellement).
 */
function evaluateAtomicBet(
  prediction: string,
  teamHome: string,
  teamAway: string,
  ctx: MatchContext,
): 'win' | 'loss' | 'void' {
  const { scoreHome, scoreAway, scoreHomeHT, scoreAwayHT, scorers,
    yellowCards, redCards, corners, shotsOnTarget,
    penaltyScored, penaltyMissed, ownGoal } = ctx;
  const p = prediction.toLowerCase().trim();
  // Normalise + traduit FR→EN les noms de nations pour matcher l'API
  // (ex : "Mexique" → "mexico", "Afrique du Sud" → "south africa").
  const pNorm = translateNationsToEn(normTeam(prediction));
  const home = normTeam(teamHome);
  const away = normTeam(teamAway);
  const total = scoreHome + scoreAway;
  const totalHT = scoreHomeHT + scoreAwayHT;
  const totalST = total - totalHT; // seconde mi-temps
  const isHomeWin = scoreHome > scoreAway;
  const isAwayWin = scoreAway > scoreHome;
  const isDraw = scoreHome === scoreAway;
  const isHomeWinHT = scoreHomeHT > scoreAwayHT;
  const isAwayWinHT = scoreAwayHT > scoreHomeHT;
  const isDrawHT = scoreHomeHT === scoreAwayHT;
  const totalYellow = yellowCards.home + yellowCards.away;
  const totalRed = redCards.home + redCards.away;
  const totalCards = totalYellow + totalRed;
  const totalCorners = corners.home + corners.away;
  const totalShotsOnTarget = shotsOnTarget.home + shotsOnTarget.away;
  const goalsHome = scorers.filter((s) => s.team === 'home').length;
  const goalsAway = scorers.filter((s) => s.team === 'away').length;
  // Note : ownGoal pour l'équipe X compte côté X dans scorers (l'API attribue
  // l'OG à l'équipe qui en profite). On garde le flag séparé pour pattern "csc".

  // === A. PATTERNS MI-TEMPS / FIN DE MATCH (MT/FT) ===
  // Ex : "MT/FT PSG/PSG", "mt nul / ft psg", "mi-temps/fin de match psg/psg"
  const mtFtMatch = p.match(/\bmt\s*\/\s*ft\b|mi[\s-]temps\s*\/\s*fin/i);
  if (mtFtMatch) {
    // Cherche 2 indicateurs séparés par "/"
    const slashIdx = p.lastIndexOf('/');
    if (slashIdx > 0) {
      const leftRaw = p.slice(0, slashIdx);
      const rightRaw = p.slice(slashIdx + 1);
      const evalSide = (side: string, isHT: boolean) => {
        const s = side.toLowerCase();
        const sNorm = normTeam(side);
        if (s.includes('nul')) return isHT ? isDrawHT : isDraw;
        if (teamMatchesInPrediction(sNorm, home)) return isHT ? isHomeWinHT : isHomeWin;
        if (teamMatchesInPrediction(sNorm, away)) return isHT ? isAwayWinHT : isAwayWin;
        return null;
      };
      const leftOk = evalSide(leftRaw, true);
      const rightOk = evalSide(rightRaw, false);
      if (leftOk != null && rightOk != null) {
        return leftOk && rightOk ? 'win' : 'loss';
      }
    }
  }

  // === B. SCORE MI-TEMPS — "MT 1-0", "mi-temps 1-0", "ht 1-0" ===
  if (/\b(mt|mi[\s-]temps|ht|halftime)\b/.test(p)) {
    const scoreHTMatch = p.match(/(\d+)\s*[-:–]\s*(\d+)/);
    if (scoreHTMatch) {
      const ph = parseInt(scoreHTMatch[1], 10);
      const pa = parseInt(scoreHTMatch[2], 10);
      return ph === scoreHomeHT && pa === scoreAwayHT ? 'win' : 'loss';
    }
    // Vainqueur mi-temps : "PSG MT", "mi-temps PSG"
    if (teamMatchesInPrediction(pNorm, home)) return isHomeWinHT ? 'win' : 'loss';
    if (teamMatchesInPrediction(pNorm, away)) return isAwayWinHT ? 'win' : 'loss';
    if (p.includes('nul')) return isDrawHT ? 'win' : 'loss';
  }

  // === C. BUTEUR — "Mbappé marque", "Gutierrez buteur", "X marque N buts" ===
  if (/\b(marque|buteur|marquer)\b/.test(p)) {
    // Cherche un nombre attendu de buts : "X marque 2 buts", "X 2 buts"
    const exactGoalsMatch = p.match(/(\d+)\s*but/);
    const expectedGoals = exactGoalsMatch ? parseInt(exactGoalsMatch[1], 10) : null;
    // Extrait le candidat-joueur en virant les mots-clés bruyants
    const candidate = p
      .replace(/\b(marque|marquer|buteur|but|buts)\b/g, ' ')
      .replace(/\d+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (candidate.length > 0) {
      const matchedScorers = scorers.filter((s) => playerMatchesInText(candidate, s.player));
      // Premier buteur : "Mbappé premier buteur" / "Mbappé ouvre le score"
      if (p.includes('premier') || p.includes('ouvre')) {
        const first = scorers[0];
        return first && playerMatchesInText(candidate, first.player) ? 'win' : 'loss';
      }
      // Dernier buteur : "Mbappé dernier buteur" / "Mbappé clôt le score"
      if (p.includes('dernier') || p.includes('clot') || p.includes('clôt')) {
        const last = scorers[scorers.length - 1];
        return last && playerMatchesInText(candidate, last.player) ? 'win' : 'loss';
      }
      if (expectedGoals != null) {
        return matchedScorers.length === expectedGoals ? 'win' : 'loss';
      }
      // Cas générique "X marque" = au moins 1 but
      return matchedScorers.length >= 1 ? 'win' : 'loss';
    }
  }

  // === D. HAT-TRICK ===
  if (p.includes('hat-trick') || p.includes('hat trick') || p.includes('triplé') || p.includes('triple')) {
    // Si on a un joueur cible, check ses buts
    const candidate = p.replace(/\b(hat[\s-]?trick|triplé|triple)\b/g, ' ').trim();
    if (candidate.length > 0) {
      const matched = scorers.filter((s) => playerMatchesInText(candidate, s.player));
      return matched.length >= 3 ? 'win' : 'loss';
    }
    // Sans nom = au moins un joueur a fait un hat-trick
    const goalsByPlayer = new Map<string, number>();
    for (const s of scorers) {
      goalsByPlayer.set(s.player, (goalsByPlayer.get(s.player) ?? 0) + 1);
    }
    return Array.from(goalsByPlayer.values()).some((n) => n >= 3) ? 'win' : 'loss';
  }

  // === E. PENALTY MARQUÉ / RATÉ ===
  if (p.includes('penalty') || p.includes('péno') || p.includes('peno')) {
    if (p.includes('raté') || p.includes('rate') || p.includes('manqué') || p.includes('arrêté')) {
      return penaltyMissed ? 'win' : 'loss';
    }
    if (p.includes('marqué') || p.includes('marque') || p.includes('réussi') || p.includes('reussi')) {
      return penaltyScored ? 'win' : 'loss';
    }
    if (p.includes('pas de') || p.includes('aucun') || p.includes('sans')) {
      return !penaltyScored && !penaltyMissed ? 'win' : 'loss';
    }
    // "Penalty dans le match" = au moins un (réussi ou raté)
    return penaltyScored || penaltyMissed ? 'win' : 'loss';
  }

  // === F. CSC (CONTRE SON CAMP) ===
  if (p.includes('csc') || p.includes('contre son camp') || p.includes('but contre')) {
    if (p.includes('pas de') || p.includes('aucun') || p.includes('sans')) {
      return !ownGoal ? 'win' : 'loss';
    }
    return ownGoal ? 'win' : 'loss';
  }

  // === G. CARTONS ===
  if (p.includes('carton') || p.includes('jaune') || p.includes('rouge')) {
    const isYellow = p.includes('jaune');
    const isRed = p.includes('rouge') && !p.includes('jaune');
    const overCards = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*carton|(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*jaune|(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*rouge/);
    const underCards = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*carton|(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*jaune|(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*rouge/);
    const refValue = isYellow ? totalYellow : isRed ? totalRed : totalCards;
    if (overCards) {
      const n = overCards.slice(1).find((v) => v != null)!;
      return refValue > parseFloat(n.replace(',', '.')) ? 'win' : 'loss';
    }
    if (underCards) {
      const n = underCards.slice(1).find((v) => v != null)!;
      return refValue < parseFloat(n.replace(',', '.')) ? 'win' : 'loss';
    }
    // "Carton rouge dans le match"
    if (isRed) return totalRed >= 1 ? 'win' : 'loss';
    if (p.includes('dans le match') || p.includes('au moins')) {
      return refValue >= 1 ? 'win' : 'loss';
    }
  }

  // === H. CORNERS ===
  if (p.includes('corner')) {
    const overC = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*corner/);
    const underC = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*corner/);
    if (overC) return totalCorners > parseFloat(overC[1].replace(',', '.')) ? 'win' : 'loss';
    if (underC) return totalCorners < parseFloat(underC[1].replace(',', '.')) ? 'win' : 'loss';
    // Équipe avec plus de corners
    if (teamMatchesInPrediction(pNorm, home)) return corners.home > corners.away ? 'win' : 'loss';
    if (teamMatchesInPrediction(pNorm, away)) return corners.away > corners.home ? 'win' : 'loss';
  }

  // === I. TIRS CADRÉS ===
  if (p.includes('tir cadré') || p.includes('tir cadre') || p.includes('tirs cadrés') || p.includes('tirs cadres') || p.includes('shots on target')) {
    const overT = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*tir/);
    const underT = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*tir/);
    if (overT) return totalShotsOnTarget > parseFloat(overT[1].replace(',', '.')) ? 'win' : 'loss';
    if (underT) return totalShotsOnTarget < parseFloat(underT[1].replace(',', '.')) ? 'win' : 'loss';
  }

  // === J. BUTS EN PREMIÈRE / SECONDE PÉRIODE ===
  const isFirstHalfButs =
    /\b(1ère|1re|premiere|première|1er|premier)\s*(mi[\s-]temps|p[ée]riode)\b/.test(p) ||
    /\b(mi[\s-]temps|p[ée]riode)\s*(1ère|1re|1)\b/.test(p);
  const isSecondHalfButs =
    /\b(2ème|2e|seconde|deuxieme|deuxième)\s*(mi[\s-]temps|p[ée]riode)\b/.test(p) ||
    /\b(mi[\s-]temps|p[ée]riode)\s*(2ème|2e|2)\b/.test(p);
  if (isFirstHalfButs || isSecondHalfButs) {
    const ref = isFirstHalfButs ? totalHT : totalST;
    const over = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)/);
    const under = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)/);
    if (over) return ref > parseFloat(over[1].replace(',', '.')) ? 'win' : 'loss';
    if (under) return ref < parseFloat(under[1].replace(',', '.')) ? 'win' : 'loss';
  }

  // === K. BUTS PAR ÉQUIPE — "PSG +1.5 buts", "Lille moins de 0.5 but" ===
  const overTeamMatch = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)\s*but/);
  const underTeamMatch = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*but/);
  const hasTeamScope = teamMatchesInPrediction(pNorm, home) || teamMatchesInPrediction(pNorm, away);
  if (hasTeamScope && (overTeamMatch || underTeamMatch)) {
    const target = teamMatchesInPrediction(pNorm, home) ? goalsHome : goalsAway;
    if (overTeamMatch) return target > parseFloat(overTeamMatch[1].replace(',', '.')) ? 'win' : 'loss';
    if (underTeamMatch) return target < parseFloat(underTeamMatch[1].replace(',', '.')) ? 'win' : 'loss';
  }

  // === 1. SCORE EXACT (à tester en premier — pattern "X-Y" très spécifique) ===
  // Match "2-1", "PSG 2-1", "2-1 Lille", etc.
  const scoreMatch = p.match(/(\d+)\s*[-:–]\s*(\d+)/);
  if (scoreMatch) {
    const predH = parseInt(scoreMatch[1], 10);
    const predA = parseInt(scoreMatch[2], 10);
    // Si l'équipe est nommée, on regarde de quel côté
    const homeFirst = teamMatchesInPrediction(pNorm, home);
    const awayFirst = teamMatchesInPrediction(pNorm, away);
    if (homeFirst && !awayFirst) {
      // "PSG 2-1" → predH côté home
      return predH === scoreHome && predA === scoreAway ? 'win' : 'loss';
    }
    if (awayFirst && !homeFirst) {
      // "2-1 Lille" mais Lille extérieur → inversé
      return predH === scoreAway && predA === scoreHome ? 'win' : 'loss';
    }
    // Format ambigu "2-1" : on tente l'ordre naturel (home-away)
    return predH === scoreHome && predA === scoreAway ? 'win' : 'loss';
  }

  // === 2. BTTS NON (à tester avant BTTS pour pas que "btts non" matche "btts" seul) ===
  if (
    p.includes('btts non') ||
    p.includes('une équipe ne marque pas') ||
    p.includes('au moins une équipe ne marque') ||
    p.includes('les deux equipes ne marquent pas')
  ) {
    return !(scoreHome > 0 && scoreAway > 0) ? 'win' : 'loss';
  }

  // === 3. BTTS OUI ===
  if (
    p.includes('btts') ||
    p.includes('les deux équipes marquent') ||
    p.includes('les deux marquent')
  ) {
    return scoreHome > 0 && scoreAway > 0 ? 'win' : 'loss';
  }

  // === 4. PLUS DE / MOINS DE X buts ===
  // Accepte "plus de 2.5", "+2.5", "over 2.5"
  const overMatch = p.match(/(?:plus de|over|\+)\s*(\d+(?:[.,]\d+)?)/);
  if (overMatch) {
    const threshold = parseFloat(overMatch[1].replace(',', '.'));
    return total > threshold ? 'win' : 'loss';
  }
  const underMatch = p.match(/(?:moins de|under|-)\s*(\d+(?:[.,]\d+)?)\s*but/);
  if (underMatch) {
    const threshold = parseFloat(underMatch[1].replace(',', '.'));
    return total < threshold ? 'win' : 'loss';
  }

  // === 5. TOTAL BUTS EXACT — "2 buts dans le match" / "3 buts exacts" ===
  const exactGoalsMatch = p.match(/^(\d+)\s*but/);
  if (exactGoalsMatch) {
    const expected = parseInt(exactGoalsMatch[1], 10);
    return total === expected ? 'win' : 'loss';
  }

  // === 6. HANDICAP (européen ou asiatique) — "PSG (-1)", "Lille (+1.5)" ===
  const handicapMatch = p.match(/\(([+-]?\d+(?:[.,]\d+)?)\)/);
  if (handicapMatch) {
    const handicap = parseFloat(handicapMatch[1].replace(',', '.'));
    const onHome = teamMatchesInPrediction(pNorm, home);
    const onAway = teamMatchesInPrediction(pNorm, away);
    if (onHome) {
      // PSG (+1.5) = PSG gagne si scoreHome + 1.5 > scoreAway
      const adjusted = scoreHome + handicap;
      if (Number.isInteger(handicap)) {
        // Handicap entier : possibilité de remboursement (égalité exacte)
        if (adjusted > scoreAway) return 'win';
        if (adjusted < scoreAway) return 'loss';
        return 'void'; // pari nul = remboursé
      }
      return adjusted > scoreAway ? 'win' : 'loss';
    }
    if (onAway) {
      const adjusted = scoreAway + handicap;
      if (Number.isInteger(handicap)) {
        if (adjusted > scoreHome) return 'win';
        if (adjusted < scoreHome) return 'loss';
        return 'void';
      }
      return adjusted > scoreHome ? 'win' : 'loss';
    }
  }

  // === 7. DOUBLE CHANCE — "PSG ou nul", "Nul ou Lille", "Lille ou Nice" ===
  if (p.includes(' ou ') || p.includes(' / ') || p.includes(' | ')) {
    const hasHome = teamMatchesInPrediction(pNorm, home);
    const hasAway = teamMatchesInPrediction(pNorm, away);
    const hasNul = p.includes('nul');
    if (hasHome && hasAway && !hasNul) {
      // "PSG ou Lille" — pas vraiment standard, on prend "pas de nul"
      return !isDraw ? 'win' : 'loss';
    }
    if (hasHome && hasNul) return isHomeWin || isDraw ? 'win' : 'loss';
    if (hasAway && hasNul) return isAwayWin || isDraw ? 'win' : 'loss';
  }

  // === 8. MATCH NUL ===
  if (p.includes('match nul') || p === 'nul' || p.includes('égalité')) {
    return isDraw ? 'win' : 'loss';
  }

  // === 9. VAINQUEUR D'ÉQUIPE — en dernier (le plus large, doit pas voler sur les autres) ===
  // "Victoire Lille", "Lille gagne", ou juste "Lille"
  if (teamMatchesInPrediction(pNorm, home)) {
    return isHomeWin ? 'win' : 'loss';
  }
  if (teamMatchesInPrediction(pNorm, away)) {
    return isAwayWin ? 'win' : 'loss';
  }

  // Inconnu → void (Julien doit trancher manuellement)
  return 'void';
}

/** Tier rank pour filtrer les destinataires push selon min_tier d'un prono. */
const tierOrder: Record<string, number> = { starter: 1, trial: 1, pro: 2, vip: 3 };

/**
 * Récupère events + statistics d'une fixture et construit le MatchContext
 * complet pour évaluer les paris exotiques (buteurs, corners, cartons...).
 *
 * Coût : 2 requêtes API supplémentaires par fixture finie. En cas
 * d'erreur on retourne un contexte "dégradé" sans events/stats (le
 * parser fera fallback sur les paris basiques + void pour les exotiques).
 */
async function buildMatchContext(
  fixture: ApiFixture,
  apiKey: string,
  homeTeamName: string,
): Promise<MatchContext> {
  const scoreHome = fixture.goals.home ?? 0;
  const scoreAway = fixture.goals.away ?? 0;
  const scoreHomeHT = fixture.score?.halftime?.home ?? 0;
  const scoreAwayHT = fixture.score?.halftime?.away ?? 0;

  // Defaults (en cas d'erreur API on continue avec ce qu'on a)
  const ctx: MatchContext = {
    scoreHome, scoreAway, scoreHomeHT, scoreAwayHT,
    scorers: [],
    yellowCards: { home: 0, away: 0 },
    redCards: { home: 0, away: 0 },
    corners: { home: 0, away: 0 },
    shotsOnTarget: { home: 0, away: 0 },
    possession: { home: 0, away: 0 },
    penaltyScored: false,
    penaltyMissed: false,
    ownGoal: false,
  };

  // /fixtures/events : buteurs, cartons, penalties, CSC
  try {
    const evRes = await fetch(`${API_BASE}/fixtures/events?fixture=${fixture.fixture.id}`, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (evRes.ok) {
      const evData = await evRes.json();
      const events = (evData.response ?? []) as ApiEvent[];
      const homeNorm = normTeam(homeTeamName);
      for (const e of events) {
        const isHome = normTeam(e.team.name) === homeNorm;
        const teamSide: 'home' | 'away' = isHome ? 'home' : 'away';
        if (e.type === 'Goal') {
          let goalType: Scorer['type'] = 'normal';
          if (e.detail === 'Own Goal') {
            goalType = 'owngoal';
            ctx.ownGoal = true;
          } else if (e.detail === 'Penalty' || e.detail === 'Missed Penalty') {
            goalType = 'penalty';
          }
          // Penalty raté ne compte PAS comme but
          if (e.detail === 'Missed Penalty') {
            ctx.penaltyMissed = true;
            continue;
          }
          if (e.detail === 'Penalty') {
            ctx.penaltyScored = true;
          }
          ctx.scorers.push({
            player: e.player.name ?? '',
            team: teamSide,
            minute: e.time.elapsed ?? 0,
            type: goalType,
          });
        } else if (e.type === 'Card') {
          if (e.detail === 'Yellow Card') {
            ctx.yellowCards[teamSide]++;
          } else if (e.detail === 'Red Card' || e.detail === 'Second Yellow card') {
            ctx.redCards[teamSide]++;
          }
        }
      }
      // Tri buteurs par minute pour premier/dernier buteur
      ctx.scorers.sort((a, b) => a.minute - b.minute);
    }
  } catch {
    // On ignore, le ctx reste avec les defaults
  }

  // /fixtures/statistics : corners, tirs cadrés, possession
  try {
    const stRes = await fetch(`${API_BASE}/fixtures/statistics?fixture=${fixture.fixture.id}`, {
      headers: { 'x-apisports-key': apiKey },
    });
    if (stRes.ok) {
      const stData = await stRes.json();
      const stats = (stData.response ?? []) as ApiStat[];
      const homeNorm = normTeam(homeTeamName);
      for (const teamStats of stats) {
        const isHome = normTeam(teamStats.team.name) === homeNorm;
        const side: 'home' | 'away' = isHome ? 'home' : 'away';
        for (const s of teamStats.statistics) {
          const value = typeof s.value === 'number' ? s.value : parseInt(String(s.value ?? '0').replace('%', ''), 10) || 0;
          if (s.type === 'Corner Kicks') ctx.corners[side] = value;
          else if (s.type === 'Shots on Goal') ctx.shotsOnTarget[side] = value;
          else if (s.type === 'Ball Possession') ctx.possession[side] = value;
        }
      }
    }
  } catch {
    // On ignore
  }

  return ctx;
}

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

  // 1) Récupère les matchs qu'on doit tracker : ceux avec un prono publié,
  // status = 'scheduled' ou 'live', match_start_at < now + 4h (= match en
  // cours ou bientôt fini).
  const nowIso = new Date().toISOString();
  const horizonIso = new Date(Date.now() + 4 * 3600 * 1000).toISOString();

  const { data: matchesToCheck, error: matchesErr } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['scheduled', 'live'])
    .lt('match_start_at', horizonIso)
    .not('api_fixture_id', 'is', null);

  if (matchesErr) {
    return new Response(JSON.stringify({ error: matchesErr.message }), { status: 500 });
  }

  // Note : la jointure peut être complexe avec PostgREST. On simplifie en
  // fetchant juste les matchs et après on cherchera les pronos liés.
  const tracking = (matchesToCheck ?? []).filter(
    (m: { api_fixture_id: number | null }) => m.api_fixture_id != null,
  );

  if (tracking.length === 0) {
    return new Response(
      JSON.stringify({ ok: true, message: 'Aucun match à tracker', checked: 0 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // 2) Pull les fixtures correspondantes en plusieurs calls API.
  // API-Football limite à 20 IDs par requête : il faut chunker.
  const fixtureIds = tracking.map((m: { api_fixture_id: number }) => m.api_fixture_id);
  const CHUNK_SIZE = 20;
  const fixtures: ApiFixture[] = [];
  const errors: string[] = [];
  for (let i = 0; i < fixtureIds.length; i += CHUNK_SIZE) {
    const chunk = fixtureIds.slice(i, i + CHUNK_SIZE);
    const idsParam = chunk.join('-');
    const url = `${API_BASE}/fixtures?ids=${idsParam}`;
    console.log(
      `[track-results] fetching chunk ${i / CHUNK_SIZE + 1}/${Math.ceil(fixtureIds.length / CHUNK_SIZE)} (${chunk.length} ids)`,
    );
    try {
      const res = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
      if (!res.ok) {
        const txt = await res.text();
        console.error('[track-results] API HTTP error', res.status, txt.slice(0, 300));
        errors.push(`chunk ${i / CHUNK_SIZE + 1}: HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const chunkErrors = data.errors;
      if (chunkErrors && Object.keys(chunkErrors).length > 0) {
        console.error('[track-results] API returned errors:', JSON.stringify(chunkErrors));
        errors.push(
          `chunk ${i / CHUNK_SIZE + 1}: ${JSON.stringify(chunkErrors).slice(0, 200)}`,
        );
        continue;
      }
      const chunkFixtures = (data.response ?? []) as ApiFixture[];
      fixtures.push(...chunkFixtures);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      console.error('[track-results] chunk fetch failed:', msg);
      errors.push(`chunk ${i / CHUNK_SIZE + 1}: ${msg}`);
    }
  }
  console.log(
    `[track-results] fetched ${fixtures.length} fixtures across ${Math.ceil(fixtureIds.length / CHUNK_SIZE)} chunks (asked for ${fixtureIds.length})`,
  );

  let totalUpdated = 0;
  let totalPushSent = 0;

  // Set des bet_ids qui ont eu au moins une sélection mise à jour →
  // pour recalculer leur résultat global après le pass A.
  const touchedBetIds = new Set<string>();

  // Sélections dont la prédiction n'a pas pu être parsée par evaluateBet
  // (donc marquées void par défaut). On notifie les admins à la fin pour
  // qu'ils tranchent manuellement.
  const unparsedSelections: Array<{
    bet_id: string;
    team_home: string;
    team_away: string;
    prediction: string;
  }> = [];

  // ========== PASS A : pour chaque fixture finie, update les sélections ==========
  // (Singles + sélections de combos sont traitées de la même manière.)
  for (const f of fixtures) {
    const newStatus = mapStatus(f.fixture.status.short);

    // Update du match dans notre cache `matches` (score + status à jour)
    await supabase
      .from('matches')
      .update({
        status: newStatus,
        status_short: f.fixture.status.short,
        score_home: f.goals.home,
        score_away: f.goals.away,
        updated_at: nowIso,
      })
      .eq('api_fixture_id', f.fixture.id);

    // Cas 1 : match ANNULÉ (envahissement de terrain, force majeure, etc.)
    // → toutes les sélections pending qui le visent passent en 'void'.
    //   Convention bookmaker FR : pari remboursé, exclu du calcul ROI.
    if (newStatus === 'cancelled') {
      const { data: pendingSelections } = await supabase
        .from('published_bet_selections')
        .select('id, published_bet_id')
        .eq('match_api_fixture_id', f.fixture.id)
        .eq('result', 'pending');
      for (const sel of pendingSelections ?? []) {
        await supabase
          .from('published_bet_selections')
          .update({ result: 'void', updated_at: nowIso })
          .eq('id', sel.id);
        touchedBetIds.add(sel.published_bet_id);
      }
      continue;
    }

    // Cas 2 : match REPORTÉ. On NE touche PAS au résultat de la sélection :
    //   le match aura une nouvelle date côté API, la cron repassera plus tard.
    if (newStatus === 'postponed') continue;

    // Cas 3 : match pas encore fini OU score manquant → on attend.
    if (newStatus !== 'finished') continue;
    if (f.goals.home == null || f.goals.away == null) continue;

    // Cas 4 : match terminé normalement → on évalue la prédiction.
    const { data: pendingSelections } = await supabase
      .from('published_bet_selections')
      .select('*')
      .eq('match_api_fixture_id', f.fixture.id)
      .eq('result', 'pending');

    if (!pendingSelections || pendingSelections.length === 0) continue;

    // On ne paye le coût des 2 calls events+statistics que s'il y a au
    // moins une sélection à évaluer pour ce match. team_home nous sert
    // à mapper "side home/away" pour chaque event/stat de l'API.
    const homeTeamName = pendingSelections[0].team_home as string;
    const ctx = await buildMatchContext(f, apiKey, homeTeamName);

    for (const sel of pendingSelections) {
      const result = evaluateBet(
        sel.prediction,
        sel.team_home,
        sel.team_away,
        ctx,
      );
      await supabase
        .from('published_bet_selections')
        .update({
          result,
          final_score: `${f.goals.home}-${f.goals.away}`,
          updated_at: nowIso,
        })
        .eq('id', sel.id);
      touchedBetIds.add(sel.published_bet_id);
      // Si le parser a échoué → on track pour push admin "à valider"
      if (result === 'void') {
        unparsedSelections.push({
          bet_id: sel.published_bet_id,
          team_home: sel.team_home,
          team_away: sel.team_away,
          prediction: sel.prediction,
        });
      }
    }
  }

  // ========== PASS B : recalcule le résultat global des paris touchés ==========
  // Pour chaque bet ayant eu une sélection updated :
  //   - Si AU MOINS une sélection encore pending → bet reste pending
  //   - Si toutes void → bet void
  //   - Sinon si au moins 1 loss → bet loss
  //   - Sinon (toutes win, peut avoir void mixte) → bet win
  for (const betId of touchedBetIds) {
    const { data: bet } = await supabase
      .from('published_bets')
      .select('*, published_bet_selections(*)')
      .eq('id', betId)
      .single();
    if (!bet) continue;
    if (bet.result !== 'pending') continue; // déjà résolu manuellement entretemps

    const sels = (bet.published_bet_selections ?? []) as Array<{
      result: string;
      prediction: string;
      team_home: string;
      team_away: string;
      final_score: string | null;
    }>;
    if (sels.length === 0) continue;

    // Une sélection encore pending → bet reste pending (combo en attente)
    const hasPending = sels.some((s) => s.result === 'pending');
    if (hasPending) continue;

    // Toutes résolues → on agrège
    const allVoid = sels.every((s) => s.result === 'void');
    const hasLoss = sels.some((s) => s.result === 'loss');
    const betResult: 'win' | 'loss' | 'void' = allVoid
      ? 'void'
      : hasLoss
        ? 'loss'
        : 'win';

    await supabase
      .from('published_bets')
      .update({ result: betResult, updated_at: nowIso })
      .eq('id', betId);
    totalUpdated++;

    // ========== Push notifs aux abonnés concernés ==========
    const minRank = tierOrder[bet.min_tier] ?? 0;
    const { data: recipients } = await supabase
      .from('profiles')
      .select('expo_push_token, tier, notification_preferences!inner(*)')
      .not('expo_push_token', 'is', null);

    const validRecipients = (recipients ?? []).filter((p: {
      tier: string | null;
      notification_preferences: {
        enabled: boolean;
        prono_results: boolean;
        sport_foot: boolean;
      };
    }) => {
      const prefs = p.notification_preferences;
      if (!prefs?.enabled || !prefs.prono_results) return false;
      if (!prefs.sport_foot) return false;
      const userRank = tierOrder[p.tier ?? ''] ?? 0;
      return userRank >= minRank;
    });

    if (validRecipients.length > 0) {
      const emoji = betResult === 'win' ? '✅' : betResult === 'loss' ? '❌' : '⚪️';
      const label = betResult === 'win' ? 'gagné' : betResult === 'loss' ? 'perdu' : 'annulé';
      // Titre adapté au type de pari (single vs combo)
      const isCombo = bet.kind === 'combo';
      const title = `${emoji} ${isCombo ? `Combiné ${sels.length} sélections` : 'Prono'} ${label}`;
      const firstSel = sels[0];
      const body = isCombo
        ? `Cote ${bet.total_odd ? Number(bet.total_odd).toFixed(2) : ''} · ${sels.length} sélections`
        : `${firstSel.team_home} - ${firstSel.team_away}${firstSel.final_score ? ` (${firstSel.final_score})` : ''} — ${firstSel.prediction}`;

      const messages = validRecipients.map((r: { expo_push_token: string }) => ({
        to: r.expo_push_token,
        title,
        body,
        sound: 'default',
        data: { type: 'prono_result', bet_id: betId, result: betResult },
      }));

      for (let i = 0; i < messages.length; i += 100) {
        const chunk = messages.slice(i, i + 100);
        try {
          const pushRes = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(chunk),
          });
          if (pushRes.ok) totalPushSent += chunk.length;
        } catch (e) {
          errors.push(`push send ${betId}: ${e instanceof Error ? e.message : 'err'}`);
        }
      }
    }
  }

  // ========== Push admin : sélections "void" non parsées ==========
  // Si au moins 1 prédiction n'a pas pu être évaluée auto → on rappelle
  // aux admins/validators qu'il faut trancher manuellement.
  let adminPushSent = 0;
  if (unparsedSelections.length > 0) {
    const { data: staff } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .in('role', ['admin', 'validator'])
      .not('expo_push_token', 'is', null);
    if (staff && staff.length > 0) {
      const n = unparsedSelections.length;
      const first = unparsedSelections[0];
      const title = `⚠️ ${n} pari${n > 1 ? 's' : ''} à valider manuellement`;
      const body =
        n === 1
          ? `${first.team_home} vs ${first.team_away} — "${first.prediction}" : prédiction non reconnue.`
          : `Plusieurs prédictions exotiques non reconnues. Vérifie l'admin.`;
      const messages = (staff as Array<{ expo_push_token: string }>).map(
        (s) => ({
          to: s.expo_push_token,
          title,
          body,
          sound: 'default',
          data: { type: 'admin_unparsed_predictions', count: n },
        }),
      );
      try {
        await fetch(EXPO_PUSH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(messages),
        });
        adminPushSent = messages.length;
      } catch (e) {
        errors.push(
          `admin push failed: ${e instanceof Error ? e.message : 'unknown'}`,
        );
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: errors.length === 0,
      checked: fixtures.length,
      updated: totalUpdated,
      pushSent: totalPushSent,
      adminPushSent,
      unparsed: unparsedSelections.length,
      errors,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
});
