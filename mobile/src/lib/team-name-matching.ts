/**
 * Matching tolérant entre un nom d'équipe saisi par l'admin (ex "Paris SG",
 * "OM", "Bayern") et le nom officiel renvoyé par API-Football (ex "Paris
 * Saint Germain", "Olympique Marseille", "FC Bayern München").
 *
 * Approche multi-stratégie :
 *  1. Alias explicites (PSG → Paris Saint Germain, etc.)
 *  2. Normalisation (lowercase, accents, ponctuation, mots vides)
 *  3. Match exact après normalisation
 *  4. Inclusion (l'un contient l'autre)
 *  5. Intersection de mots significatifs (>= 50% de tokens partagés)
 *  6. Initiales correspondantes ("PSG" → tokens commencent par P, S, G)
 *
 * Important : on évite les faux positifs type "Paris SG" vs "Paris FC".
 * Le mot "Paris" seul n'est pas discriminant — il faut au moins 2 mots
 * significatifs en commun OU un alias explicite.
 */

const ALIASES: Record<string, string[]> = {
  // PSG
  psg: ['paris saint germain', 'paris sg'],
  'paris sg': ['paris saint germain'],
  // OM
  om: ['olympique marseille', 'olympique de marseille', 'marseille'],
  marseille: ['olympique marseille', 'olympique de marseille'],
  // OL
  ol: ['olympique lyonnais', 'lyon'],
  lyon: ['olympique lyonnais'],
  // OGC Nice
  nice: ['ogc nice', 'ogc nice cote azur'],
  // Bayern
  bayern: ['fc bayern munchen', 'bayern munich', 'bayern münchen'],
  'bayern munich': ['fc bayern munchen', 'bayern münchen'],
  // Real / Atletico
  real: ['real madrid'],
  atletico: ['atletico madrid', 'club atletico de madrid'],
  // Inter / Milan
  inter: ['inter milan', 'internazionale', 'fc internazionale milano'],
  milan: ['ac milan'],
  // Borussia
  dortmund: ['borussia dortmund'],
  bvb: ['borussia dortmund'],
  // Manchester
  'man city': ['manchester city'],
  'man united': ['manchester united'],
  'manchester united': ['manchester utd'],
  // Tottenham
  spurs: ['tottenham', 'tottenham hotspur'],
  // Stade Brestois / Brest
  brest: ['stade brestois 29', 'stade brestois'],
  // Stade Rennais / Rennes
  rennes: ['stade rennais', 'stade rennais fc'],
};

/** Mots ignorés car non-discriminants. */
const STOP_WORDS = new Set([
  'fc',
  'cf',
  'sc',
  'ac',
  'as',
  'fk',
  'sk',
  'ks',
  'fcb',
  'club',
  'de',
  'du',
  'des',
  'la',
  'le',
  'les',
  'el',
  'al',
  'di',
  'da',
  'do',
  'der',
  'die',
  'das',
  'and',
  'et',
  'real',
  'royal',
  'football',
  'sport',
  'sports',
  'sporting',
  'united',
  'utd',
  '1893',
  '1899',
  '1900',
  '1901',
  '1902',
  '1903',
  '1904',
  '1905',
  '1906',
  '1907',
  '1908',
  '1909',
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    // eslint-disable-next-line no-misleading-character-class
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.,'’\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function significantTokens(s: string): string[] {
  return normalize(s)
    .split(' ')
    .filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
}

function isInitialsOf(short: string, long: string): boolean {
  // "PSG" vs "Paris Saint Germain"
  const initials = short.replace(/[^a-z]/g, '');
  if (initials.length < 2 || initials.length > 5) return false;
  const tokens = significantTokens(long);
  if (tokens.length < initials.length) return false;
  const tokenInitials = tokens.map((t) => t[0]).join('');
  return tokenInitials.startsWith(initials);
}

// Import à la fin du fichier pour éviter le require dans la fonction.
// Nation FR ↔ EN : "Allemagne" doit matcher "Germany" en DB.
import { toEnglishNation } from './team-display-names';

export function teamMatches(a: string, b: string): boolean {
  if (!a || !b) return false;
  // Si l'un des deux est une nation FR (ex: "Allemagne"), on le passe en EN
  // pour matcher contre ce qui est en DB (qui vient d'API-Football en EN).
  const aTr = toEnglishNation(a);
  const bTr = toEnglishNation(b);
  const na = normalize(aTr);
  const nb = normalize(bTr);
  if (na === nb) return true;

  // 1. Alias direct dans les 2 sens
  const aliasesA = ALIASES[na] ?? [];
  if (aliasesA.some((x) => x === nb)) return true;
  const aliasesB = ALIASES[nb] ?? [];
  if (aliasesB.some((x) => x === na)) return true;
  // Transitif : si A a un alias commun avec B
  if (aliasesA.some((x) => normalize(x) === nb)) return true;
  if (aliasesB.some((x) => normalize(x) === na)) return true;

  // 2. Initiales : "PSG" vs "Paris Saint Germain"
  if (isInitialsOf(na, nb)) return true;
  if (isInitialsOf(nb, na)) return true;

  // 3. Intersection de mots significatifs : au moins 2 mots communs
  //    OU 1 mot commun unique (équipes courtes type "Lens", "Lyon")
  const tokensA = significantTokens(a);
  const tokensB = significantTokens(b);
  if (tokensA.length === 0 || tokensB.length === 0) return false;
  const setB = new Set(tokensB);
  const common = tokensA.filter((t) => setB.has(t));
  if (common.length >= 2) return true;
  // Pour les noms courts (1 token significatif des 2 côtés), ce token
  // doit être présent dans les 2 → match exact équipe nom court.
  if (
    common.length === 1 &&
    tokensA.length === 1 &&
    tokensB.length === 1
  ) {
    return true;
  }
  // Pour les noms longs où un seul token correspond, on demande que ce
  // token soit DISCRIMINANT (pas un mot trop générique).
  if (common.length === 1) {
    const w = common[0];
    // Si le mot fait plus de 5 lettres ET n'est pas un nom de ville
    // partagée (Paris, Madrid, Manchester) → on accepte.
    const sharedCities = new Set([
      'paris',
      'madrid',
      'manchester',
      'london',
      'roma',
      'milan',
      'munich',
      'berlin',
      'barcelona',
      'lisbon',
      'porto',
      'istanbul',
      'athens',
    ]);
    if (w.length > 5 && !sharedCities.has(w)) return true;
  }

  return false;
}
