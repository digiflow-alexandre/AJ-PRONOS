/**
 * Pool de logos d'équipes (foot) et drapeaux pays (tennis).
 * Partagé entre fixtures.ts, combo-fixtures.ts et fake-stats.ts.
 *
 * Source : API-Sports CDN (footbal) + flagcdn.com (tennis).
 * Sera remplacé par les vrais logos remontés par API-Football quand
 * on aura le backend.
 */

// =============================================================================
// Logos clubs foot (CDN API-Sports, gratuit, sans auth)
// =============================================================================
export const TEAM_LOGOS: Record<string, string> = {
  // ===== Ligue 1 =====
  PSG: 'https://media.api-sports.io/football/teams/85.png',
  Lyon: 'https://media.api-sports.io/football/teams/80.png',
  Marseille: 'https://media.api-sports.io/football/teams/81.png',
  Monaco: 'https://media.api-sports.io/football/teams/91.png',
  Nice: 'https://media.api-sports.io/football/teams/84.png',
  Lens: 'https://media.api-sports.io/football/teams/116.png',
  Lille: 'https://media.api-sports.io/football/teams/79.png',
  Rennes: 'https://media.api-sports.io/football/teams/94.png',
  Brest: 'https://media.api-sports.io/football/teams/106.png',
  Reims: 'https://media.api-sports.io/football/teams/93.png',
  Strasbourg: 'https://media.api-sports.io/football/teams/95.png',
  Toulouse: 'https://media.api-sports.io/football/teams/96.png',
  Nantes: 'https://media.api-sports.io/football/teams/83.png',
  Auxerre: 'https://media.api-sports.io/football/teams/108.png',
  'Le Havre': 'https://media.api-sports.io/football/teams/111.png',
  Montpellier: 'https://media.api-sports.io/football/teams/82.png',
  Angers: 'https://media.api-sports.io/football/teams/77.png',
  'Saint-Étienne': 'https://media.api-sports.io/football/teams/1063.png',
  'Paris FC': 'https://media.api-sports.io/football/teams/107.png',

  // ===== La Liga (20 équipes) =====
  'Real Madrid': 'https://media.api-sports.io/football/teams/541.png',
  Real: 'https://media.api-sports.io/football/teams/541.png',
  Barcelona: 'https://media.api-sports.io/football/teams/529.png',
  Barça: 'https://media.api-sports.io/football/teams/529.png',
  Barcelone: 'https://media.api-sports.io/football/teams/529.png',
  Atletico: 'https://media.api-sports.io/football/teams/530.png',
  Atlético: 'https://media.api-sports.io/football/teams/530.png',
  Athletic: 'https://media.api-sports.io/football/teams/531.png',
  Villarreal: 'https://media.api-sports.io/football/teams/533.png',
  'Real Sociedad': 'https://media.api-sports.io/football/teams/548.png',
  Betis: 'https://media.api-sports.io/football/teams/543.png',
  Valence: 'https://media.api-sports.io/football/teams/532.png',
  Valencia: 'https://media.api-sports.io/football/teams/532.png',
  Séville: 'https://media.api-sports.io/football/teams/536.png',
  Osasuna: 'https://media.api-sports.io/football/teams/727.png',
  Girona: 'https://media.api-sports.io/football/teams/547.png',
  Mallorca: 'https://media.api-sports.io/football/teams/798.png',
  'Rayo Vallecano': 'https://media.api-sports.io/football/teams/728.png',
  Getafe: 'https://media.api-sports.io/football/teams/546.png',
  'Las Palmas': 'https://media.api-sports.io/football/teams/534.png',
  Leganés: 'https://media.api-sports.io/football/teams/537.png',
  Celta: 'https://media.api-sports.io/football/teams/538.png',
  'Celta Vigo': 'https://media.api-sports.io/football/teams/538.png',
  Espanyol: 'https://media.api-sports.io/football/teams/540.png',
  Valladolid: 'https://media.api-sports.io/football/teams/720.png',
  Alavés: 'https://media.api-sports.io/football/teams/542.png',

  // ===== Premier League =====
  Liverpool: 'https://media.api-sports.io/football/teams/40.png',
  Arsenal: 'https://media.api-sports.io/football/teams/42.png',
  'Man City': 'https://media.api-sports.io/football/teams/50.png',
  Chelsea: 'https://media.api-sports.io/football/teams/49.png',
  Tottenham: 'https://media.api-sports.io/football/teams/47.png',
  Newcastle: 'https://media.api-sports.io/football/teams/34.png',
  'Aston Villa': 'https://media.api-sports.io/football/teams/66.png',
  Brighton: 'https://media.api-sports.io/football/teams/51.png',
  'Man United': 'https://media.api-sports.io/football/teams/33.png',
  'West Ham': 'https://media.api-sports.io/football/teams/48.png',
  Brentford: 'https://media.api-sports.io/football/teams/55.png',
  Fulham: 'https://media.api-sports.io/football/teams/36.png',
  Bournemouth: 'https://media.api-sports.io/football/teams/35.png',
  'Crystal Palace': 'https://media.api-sports.io/football/teams/52.png',
  Nottingham: 'https://media.api-sports.io/football/teams/65.png',
  Wolves: 'https://media.api-sports.io/football/teams/39.png',
  Everton: 'https://media.api-sports.io/football/teams/45.png',
  Leicester: 'https://media.api-sports.io/football/teams/46.png',
  Ipswich: 'https://media.api-sports.io/football/teams/57.png',
  Southampton: 'https://media.api-sports.io/football/teams/41.png',

  // ===== Bundesliga (18 équipes) =====
  Bayern: 'https://media.api-sports.io/football/teams/157.png',
  'B. Munich': 'https://media.api-sports.io/football/teams/157.png',
  'Bayern Munich': 'https://media.api-sports.io/football/teams/157.png',
  Dortmund: 'https://media.api-sports.io/football/teams/165.png',
  Borussia: 'https://media.api-sports.io/football/teams/165.png',
  Mainz: 'https://media.api-sports.io/football/teams/164.png',
  Bayer: 'https://media.api-sports.io/football/teams/168.png',
  'RB Leipzig': 'https://media.api-sports.io/football/teams/173.png',
  'Eintracht Francfort': 'https://media.api-sports.io/football/teams/169.png',
  Stuttgart: 'https://media.api-sports.io/football/teams/172.png',
  Wolfsburg: 'https://media.api-sports.io/football/teams/161.png',
  Hoffenheim: 'https://media.api-sports.io/football/teams/167.png',
  'Werder Brême': 'https://media.api-sports.io/football/teams/162.png',
  Fribourg: 'https://media.api-sports.io/football/teams/160.png',
  Augsburg: 'https://media.api-sports.io/football/teams/170.png',
  'Union Berlin': 'https://media.api-sports.io/football/teams/182.png',
  Mönchengladbach: 'https://media.api-sports.io/football/teams/163.png',
  'Holstein Kiel': 'https://media.api-sports.io/football/teams/175.png',
  'St Pauli': 'https://media.api-sports.io/football/teams/186.png',
  Heidenheim: 'https://media.api-sports.io/football/teams/180.png',
  Bochum: 'https://media.api-sports.io/football/teams/176.png',

  // ===== Serie A (20 équipes) =====
  Inter: 'https://media.api-sports.io/football/teams/505.png',
  Milan: 'https://media.api-sports.io/football/teams/489.png',
  Juventus: 'https://media.api-sports.io/football/teams/496.png',
  Roma: 'https://media.api-sports.io/football/teams/497.png',
  Torino: 'https://media.api-sports.io/football/teams/503.png',
  Napoli: 'https://media.api-sports.io/football/teams/492.png',
  Atalanta: 'https://media.api-sports.io/football/teams/499.png',
  Fiorentina: 'https://media.api-sports.io/football/teams/502.png',
  Lazio: 'https://media.api-sports.io/football/teams/487.png',
  Bologne: 'https://media.api-sports.io/football/teams/500.png',
  Empoli: 'https://media.api-sports.io/football/teams/511.png',
  Genoa: 'https://media.api-sports.io/football/teams/495.png',
  Verona: 'https://media.api-sports.io/football/teams/504.png',
  Cagliari: 'https://media.api-sports.io/football/teams/490.png',
  Lecce: 'https://media.api-sports.io/football/teams/867.png',
  Monza: 'https://media.api-sports.io/football/teams/1579.png',
  Como: 'https://media.api-sports.io/football/teams/895.png',
  Parma: 'https://media.api-sports.io/football/teams/521.png',
  Venezia: 'https://media.api-sports.io/football/teams/517.png',
  Udinese: 'https://media.api-sports.io/football/teams/494.png',

  // ===== Misc / Champions =====
  Sporting: 'https://media.api-sports.io/football/teams/228.png',
  Benfica: 'https://media.api-sports.io/football/teams/211.png',
  Celtic: 'https://media.api-sports.io/football/teams/247.png',
};

/** Récupère le logo d'une équipe foot (undefined si absent du pool). */
export function getTeamLogo(teamName: string): string | undefined {
  return TEAM_LOGOS[teamName];
}

// =============================================================================
// Drapeaux pays (tennis) — flagcdn.com
// =============================================================================
const FLAG_BY_PLAYER: Record<string, string> = {
  Alcaraz: 'es',
  Sinner: 'it',
  Djokovic: 'rs',
  Ruud: 'no',
  Zverev: 'de',
  Medvedev: 'ru',
  Fritz: 'us',
  Tsitsipas: 'gr',
  Rune: 'dk',
  Dimitrov: 'bg',
  'Auger-Aliassime': 'ca',
  Rublev: 'ru',
  Murray: 'gb',
  Nadal: 'es',
  Federer: 'ch',
};

export function getPlayerFlag(playerName: string): string | undefined {
  // 1) Si le nom contient un suffixe (XX) avec un code ISO2 → utilise direct
  //    ex "John Smith (fr)" → drapeau FR. Permet de gérer les joueurs custom.
  const suffixMatch = playerName.match(/\s*\(([A-Za-z]{2})\)\s*$/);
  if (suffixMatch) {
    const code = suffixMatch[1].toLowerCase();
    return `https://flagcdn.com/w80/${code}.png`;
  }
  // 2) Sinon, cherche dans la liste des joueurs connus (top ATP/WTA)
  const cleanName = playerName.replace(/\s*\([A-Z]+\)\s*$/, '').trim();
  const iso = FLAG_BY_PLAYER[cleanName];
  if (!iso) return undefined;
  return `https://flagcdn.com/w80/${iso}.png`;
}

/** Extrait le nom propre d'un joueur en retirant le suffixe pays éventuel. */
export function getPlayerCleanName(playerName: string): string {
  return playerName.replace(/\s*\([A-Za-z]{2,3}\)\s*$/, '').trim();
}

/**
 * Récupère logo équipe (foot) ou drapeau joueur (tennis) selon le sport.
 */
export function getCompetitorLogo(
  name: string,
  sport: 'foot' | 'tennis',
): string | undefined {
  return sport === 'foot' ? getTeamLogo(name) : getPlayerFlag(name);
}
