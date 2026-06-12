/**
 * Base structurée des compétitions, équipes et joueurs pour les pickers
 * admin. Permet à Julien de sélectionner rapidement sans faute de frappe
 * et avec matching automatique des logos.
 */

import type { Sport } from '@/types/prono';

export type CompetitionDef = {
  id: string; // identifiant stable (slug), ex "ligue-1"
  label: string; // libellé affiché, ex "Ligue 1"
  sport: Sport;
  countryCode?: string; // ISO2 pour drapeau, ex "fr"
  /** Icône SF Symbol affichée quand pas de drapeau (compétitions internationales). */
  iconFallback?: string;
  /** Pour le foot : liste des équipes de la compétition. Pour tennis : undefined. */
  teams?: string[];
  /** ID API-Football pour pull les matchs/stats via l'API. undefined = pas tracké. */
  apiLeagueId?: number;
};

// =============================================================================
// FOOT — compétitions principales + équipes connues
// =============================================================================

const LIGUE_1_TEAMS = [
  'PSG',
  'Marseille',
  'Monaco',
  'Lyon',
  'Lille',
  'Nice',
  'Lens',
  'Rennes',
  'Strasbourg',
  'Brest',
  'Reims',
  'Toulouse',
  'Nantes',
  'Auxerre',
  'Le Havre',
  'Montpellier',
  'Angers',
  'Saint-Étienne',
  'Paris FC',
];

const LA_LIGA_TEAMS = [
  'Real Madrid',
  'Barcelona',
  'Atletico',
  'Athletic',
  'Villarreal',
  'Real Sociedad',
  'Betis',
  'Valencia',
  'Séville',
  'Osasuna',
  'Girona',
  'Mallorca',
  'Rayo Vallecano',
  'Getafe',
  'Las Palmas',
  'Leganés',
  'Celta Vigo',
  'Espanyol',
  'Valladolid',
  'Alavés',
];

const PREMIER_LEAGUE_TEAMS = [
  'Liverpool',
  'Arsenal',
  'Man City',
  'Chelsea',
  'Tottenham',
  'Newcastle',
  'Aston Villa',
  'Brighton',
  'Man United',
  'West Ham',
  'Brentford',
  'Fulham',
  'Bournemouth',
  'Crystal Palace',
  'Nottingham',
  'Wolves',
  'Everton',
  'Leicester',
  'Ipswich',
  'Southampton',
];

const BUNDESLIGA_TEAMS = [
  'Bayern',
  'Dortmund',
  'Bayer',
  'Mainz',
  'RB Leipzig',
  'Eintracht Francfort',
  'Stuttgart',
  'Wolfsburg',
  'Hoffenheim',
  'Werder Brême',
  'Fribourg',
  'Borussia',
  'Augsburg',
  'Union Berlin',
  'Mönchengladbach',
  'Holstein Kiel',
  'St Pauli',
  'Heidenheim',
  'Bochum',
];

const SERIE_A_TEAMS = [
  'Inter',
  'Milan',
  'Juventus',
  'Roma',
  'Napoli',
  'Atalanta',
  'Torino',
  'Fiorentina',
  'Lazio',
  'Bologne',
  'Empoli',
  'Genoa',
  'Verona',
  'Cagliari',
  'Lecce',
  'Monza',
  'Como',
  'Parma',
  'Venezia',
  'Udinese',
];

// Pour les compétitions UEFA, on liste les "gros clubs" courants — l'option
// "Autre..." restera dispo pour les clubs de moindre niveau.
const UEFA_TOP_TEAMS = Array.from(
  new Set([
    ...LIGUE_1_TEAMS,
    ...LA_LIGA_TEAMS,
    ...PREMIER_LEAGUE_TEAMS,
    ...BUNDESLIGA_TEAMS,
    ...SERIE_A_TEAMS,
    'Sporting',
    'Benfica',
    'Celtic',
    'Porto',
    'Ajax',
    'PSV',
    'Feyenoord',
    'Galatasaray',
    'Fenerbahçe',
  ]),
).sort();

export const FOOT_COMPETITIONS: CompetitionDef[] = [
  { id: 'ligue-1', label: 'Ligue 1', sport: 'foot', countryCode: 'fr', teams: LIGUE_1_TEAMS, apiLeagueId: 61 },
  { id: 'la-liga', label: 'La Liga', sport: 'foot', countryCode: 'es', teams: LA_LIGA_TEAMS, apiLeagueId: 140 },
  {
    id: 'premier-league',
    label: 'Premier League',
    sport: 'foot',
    countryCode: 'gb',
    teams: PREMIER_LEAGUE_TEAMS,
    apiLeagueId: 39,
  },
  { id: 'bundesliga', label: 'Bundesliga', sport: 'foot', countryCode: 'de', teams: BUNDESLIGA_TEAMS, apiLeagueId: 78 },
  { id: 'serie-a', label: 'Serie A', sport: 'foot', countryCode: 'it', teams: SERIE_A_TEAMS, apiLeagueId: 135 },
  {
    id: 'champions-league',
    label: 'Champions League',
    sport: 'foot',
    iconFallback: 'trophy.fill',
    teams: UEFA_TOP_TEAMS,
    apiLeagueId: 2,
  },
  {
    id: 'europa-league',
    label: 'Europa League',
    sport: 'foot',
    iconFallback: 'trophy.fill',
    teams: UEFA_TOP_TEAMS,
    apiLeagueId: 3,
  },
  // Compétitions ajoutées 2026-06-05
  { id: 'primeira-liga', label: 'Primeira Liga', sport: 'foot', countryCode: 'pt', iconFallback: 'soccerball', apiLeagueId: 94 },
  { id: 'super-lig', label: 'Süper Lig', sport: 'foot', countryCode: 'tr', iconFallback: 'soccerball', apiLeagueId: 203 },
  // Coupes nationales
  { id: 'coupe-de-france', label: 'Coupe de France', sport: 'foot', countryCode: 'fr', iconFallback: 'trophy.fill', apiLeagueId: 66 },
  { id: 'fa-cup', label: 'FA Cup', sport: 'foot', countryCode: 'gb', iconFallback: 'trophy.fill', apiLeagueId: 45 },
  { id: 'efl-cup', label: 'EFL Cup', sport: 'foot', countryCode: 'gb', iconFallback: 'trophy.fill', apiLeagueId: 48 },
  { id: 'copa-del-rey', label: 'Copa del Rey', sport: 'foot', countryCode: 'es', iconFallback: 'trophy.fill', apiLeagueId: 143 },
  { id: 'dfb-pokal', label: 'DFB-Pokal', sport: 'foot', countryCode: 'de', iconFallback: 'trophy.fill', apiLeagueId: 81 },
  { id: 'coppa-italia', label: 'Coppa Italia', sport: 'foot', countryCode: 'it', iconFallback: 'trophy.fill', apiLeagueId: 137 },
  { id: 'taca-de-portugal', label: 'Taça de Portugal', sport: 'foot', countryCode: 'pt', iconFallback: 'trophy.fill', apiLeagueId: 96 },
  // UEFA
  { id: 'conference-league', label: 'Conference League', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 848 },
  { id: 'uefa-super-cup', label: 'UEFA Super Cup', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 531 },
  // Équipes nationales
  { id: 'mondial', label: 'Coupe du Monde', sport: 'foot', iconFallback: 'globe', apiLeagueId: 1 },
  { id: 'euro', label: 'Euro', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 4 },
  { id: 'ligue-des-nations', label: 'Ligue des Nations', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 5 },
  { id: 'copa-america', label: 'Copa America', sport: 'foot', iconFallback: 'globe', apiLeagueId: 9 },
  { id: 'can', label: 'CAN', sport: 'foot', iconFallback: 'globe', apiLeagueId: 6 },
  // Amicaux
  { id: 'amical-clubs', label: 'Match amical', sport: 'foot', iconFallback: 'soccerball', apiLeagueId: 667 },
  { id: 'amical-nations', label: 'Match amical (nations)', sport: 'foot', iconFallback: 'globe', apiLeagueId: 10 },
  // ===== FÉMININ (ajouté 2026-06-09) =====
  // Top 5 championnats féminins européens
  { id: 'd1-arkema', label: 'D1 Arkema (F)', sport: 'foot', countryCode: 'fr', iconFallback: 'soccerball', apiLeagueId: 64 },
  { id: 'wsl', label: 'WSL (F)', sport: 'foot', countryCode: 'gb', iconFallback: 'soccerball', apiLeagueId: 44 },
  { id: 'frauen-bundesliga', label: 'Frauen-Bundesliga (F)', sport: 'foot', countryCode: 'de', iconFallback: 'soccerball', apiLeagueId: 82 },
  { id: 'liga-f', label: 'Liga F (F)', sport: 'foot', countryCode: 'es', iconFallback: 'soccerball', apiLeagueId: 197 },
  { id: 'serie-a-femminile', label: 'Serie A Femminile', sport: 'foot', countryCode: 'it', iconFallback: 'soccerball', apiLeagueId: 139 },
  // USA
  { id: 'nwsl', label: 'NWSL (F)', sport: 'foot', countryCode: 'us', iconFallback: 'soccerball', apiLeagueId: 254 },
  // UEFA clubs féminins
  { id: 'uwcl', label: 'UEFA Women\'s Champions League', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 528 },
  // Équipes nationales féminines
  { id: 'mondial-f', label: 'Coupe du Monde Féminine', sport: 'foot', iconFallback: 'globe', apiLeagueId: 8 },
  // Les qualifs UEFA passent en réalité par la Ligue des Nations Féminine
  // (UEFA Women's Nations League) qui sert de qualif Mondial 2027.
  { id: 'mondial-f-quali', label: 'Qualif. Mondial Féminin', sport: 'foot', iconFallback: 'globe', apiLeagueId: 1040 },
  { id: 'euro-f', label: 'Euro Féminin', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 525 },
  { id: 'euro-f-quali', label: 'Qualif. Euro Féminin', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 527 },
  { id: 'nations-league-f', label: 'Ligue des Nations Féminine', sport: 'foot', iconFallback: 'trophy.fill', apiLeagueId: 1040 },
];

// =============================================================================
// TENNIS — tournois + joueurs top
// =============================================================================

export const TENNIS_COMPETITIONS: CompetitionDef[] = [
  { id: 'australian-open', label: 'Australian Open', sport: 'tennis', countryCode: 'au' },
  { id: 'roland-garros', label: 'Roland-Garros', sport: 'tennis', countryCode: 'fr' },
  { id: 'wimbledon', label: 'Wimbledon', sport: 'tennis', countryCode: 'gb' },
  { id: 'us-open', label: 'US Open', sport: 'tennis', countryCode: 'us' },
  { id: 'atp-masters-1000', label: 'Masters 1000', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'atp-500', label: 'ATP 500', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'atp-250', label: 'ATP 250', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'atp-finals', label: 'ATP Finals', sport: 'tennis', iconFallback: 'trophy.fill' },
  { id: 'wta-1000', label: 'WTA 1000', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'wta-500', label: 'WTA 500', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'wta-250', label: 'WTA 250', sport: 'tennis', iconFallback: 'tennis.racket' },
  { id: 'wta-finals', label: 'WTA Finals', sport: 'tennis', iconFallback: 'trophy.fill' },
];

/**
 * Top joueurs ATP/WTA pour l'autocomplete tennis. Étend FLAG_BY_PLAYER
 * de team-logos.ts pour couvrir plus de joueurs. À étendre au fur et
 * à mesure (Julien remontera les manques).
 */
export const TENNIS_PLAYERS: { name: string; countryCode: string }[] = [
  // ATP top
  { name: 'Alcaraz', countryCode: 'es' },
  { name: 'Sinner', countryCode: 'it' },
  { name: 'Djokovic', countryCode: 'rs' },
  { name: 'Zverev', countryCode: 'de' },
  { name: 'Medvedev', countryCode: 'ru' },
  { name: 'Fritz', countryCode: 'us' },
  { name: 'Ruud', countryCode: 'no' },
  { name: 'Tsitsipas', countryCode: 'gr' },
  { name: 'Rune', countryCode: 'dk' },
  { name: 'Dimitrov', countryCode: 'bg' },
  { name: 'Auger-Aliassime', countryCode: 'ca' },
  { name: 'Rublev', countryCode: 'ru' },
  { name: 'De Minaur', countryCode: 'au' },
  { name: 'Hurkacz', countryCode: 'pl' },
  { name: 'Berrettini', countryCode: 'it' },
  { name: 'Musetti', countryCode: 'it' },
  { name: 'Humbert', countryCode: 'fr' },
  { name: 'Monfils', countryCode: 'fr' },
  { name: 'Fils', countryCode: 'fr' },
  { name: 'Mpetshi Perricard', countryCode: 'fr' },
  { name: 'Shelton', countryCode: 'us' },
  { name: 'Paul', countryCode: 'us' },
  { name: 'Tiafoe', countryCode: 'us' },
  { name: 'Korda', countryCode: 'us' },
  { name: 'Khachanov', countryCode: 'ru' },
  { name: 'Cerundolo', countryCode: 'ar' },
  { name: 'Tabilo', countryCode: 'cl' },
  { name: 'Draper', countryCode: 'gb' },
  { name: 'Cobolli', countryCode: 'it' },
  { name: 'Arnaldi', countryCode: 'it' },
  // WTA top
  { name: 'Sabalenka', countryCode: 'by' },
  { name: 'Swiatek', countryCode: 'pl' },
  { name: 'Gauff', countryCode: 'us' },
  { name: 'Pegula', countryCode: 'us' },
  { name: 'Paolini', countryCode: 'it' },
  { name: 'Rybakina', countryCode: 'kz' },
  { name: 'Krejcikova', countryCode: 'cz' },
  { name: 'Zheng', countryCode: 'cn' },
  { name: 'Andreeva', countryCode: 'ru' },
  { name: 'Navarro', countryCode: 'us' },
  { name: 'Kasatkina', countryCode: 'ru' },
  { name: 'Vekic', countryCode: 'hr' },
  { name: 'Garcia', countryCode: 'fr' },
  { name: 'Mertens', countryCode: 'be' },
  { name: 'Keys', countryCode: 'us' },
  { name: 'Ostapenko', countryCode: 'lv' },
  { name: 'Muchova', countryCode: 'cz' },
  { name: 'Badosa', countryCode: 'es' },
  { name: 'Bencic', countryCode: 'ch' },
];

// =============================================================================
// Pays courants au tennis (pour custom-pick d'un joueur non listé)
// =============================================================================
export const TENNIS_COUNTRIES: { code: string; name: string }[] = [
  { code: 'fr', name: 'France' },
  { code: 'es', name: 'Espagne' },
  { code: 'it', name: 'Italie' },
  { code: 'gb', name: 'Royaume-Uni' },
  { code: 'us', name: 'États-Unis' },
  { code: 'ch', name: 'Suisse' },
  { code: 'de', name: 'Allemagne' },
  { code: 'rs', name: 'Serbie' },
  { code: 'ru', name: 'Russie' },
  { code: 'au', name: 'Australie' },
  { code: 'ca', name: 'Canada' },
  { code: 'ar', name: 'Argentine' },
  { code: 'br', name: 'Brésil' },
  { code: 'cl', name: 'Chili' },
  { code: 'pl', name: 'Pologne' },
  { code: 'cz', name: 'Tchéquie' },
  { code: 'gr', name: 'Grèce' },
  { code: 'bg', name: 'Bulgarie' },
  { code: 'no', name: 'Norvège' },
  { code: 'dk', name: 'Danemark' },
  { code: 'be', name: 'Belgique' },
  { code: 'nl', name: 'Pays-Bas' },
  { code: 'at', name: 'Autriche' },
  { code: 'jp', name: 'Japon' },
  { code: 'cn', name: 'Chine' },
  { code: 'kz', name: 'Kazakhstan' },
  { code: 'by', name: 'Biélorussie' },
  { code: 'lv', name: 'Lettonie' },
  { code: 'hr', name: 'Croatie' },
  { code: 'pt', name: 'Portugal' },
  { code: 'fi', name: 'Finlande' },
  { code: 'se', name: 'Suède' },
  { code: 'hu', name: 'Hongrie' },
  { code: 'ua', name: 'Ukraine' },
  { code: 'ro', name: 'Roumanie' },
  { code: 'sk', name: 'Slovaquie' },
  { code: 'tn', name: 'Tunisie' },
  { code: 'za', name: 'Afrique du Sud' },
  { code: 'in', name: 'Inde' },
  { code: 'kr', name: 'Corée du Sud' },
];

// =============================================================================
// Helpers
// =============================================================================

export function getCompetitionsForSport(sport: Sport): CompetitionDef[] {
  return sport === 'foot' ? FOOT_COMPETITIONS : TENNIS_COMPETITIONS;
}

export function getTeamsForCompetition(competitionId: string): string[] {
  const comp = [...FOOT_COMPETITIONS, ...TENNIS_COMPETITIONS].find(
    (c) => c.id === competitionId,
  );
  return comp?.teams ?? [];
}

/**
 * Renvoie le drapeau d'un pays au format URL flagcdn.
 * "world" et "eu" sont des cas spéciaux → renvoie undefined (pas d'image
 * disponible, l'UI fallback sur emoji ou icône générique).
 */
export function getFlagUrl(countryCode: string | undefined): string | undefined {
  if (!countryCode || countryCode === 'world' || countryCode === 'eu') {
    return undefined;
  }
  return `https://flagcdn.com/w80/${countryCode}.png`;
}
