import type { Prono } from '@/types/prono';

// Helpers pour générer des dates relatives.
// Note : ces fixtures sont temporaires — elles seront remplacées par des
// données Supabase quand les agents IA seront branchés (Phase MVP point 9).
function offsetDayAt(daysOffset: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const todayAt = (h: number, m = 0) => offsetDayAt(0, h, m);
const tomorrowAt = (h: number, m = 0) => offsetDayAt(1, h, m);
const yesterdayAt = (h: number, m = 0) => offsetDayAt(-1, h, m);
const minus2At = (h: number, m = 0) => offsetDayAt(-2, h, m);
const minus3At = (h: number, m = 0) => offsetDayAt(-3, h, m);

// Logos API-Sports CDN (gratuit, sans auth).
const LOGO = {
  psg: 'https://media.api-sports.io/football/teams/85.png',
  lyon: 'https://media.api-sports.io/football/teams/80.png',
  marseille: 'https://media.api-sports.io/football/teams/81.png',
  monaco: 'https://media.api-sports.io/football/teams/91.png',
  rennes: 'https://media.api-sports.io/football/teams/94.png',
  lille: 'https://media.api-sports.io/football/teams/79.png',
  realMadrid: 'https://media.api-sports.io/football/teams/541.png',
  barcelona: 'https://media.api-sports.io/football/teams/529.png',
  manCity: 'https://media.api-sports.io/football/teams/50.png',
  arsenal: 'https://media.api-sports.io/football/teams/42.png',
  liverpool: 'https://media.api-sports.io/football/teams/40.png',
  chelsea: 'https://media.api-sports.io/football/teams/49.png',
};

// Drapeaux pays pour le tennis (flagcdn.com gratuit)
const FLAG = {
  fr: 'https://flagcdn.com/w80/fr.png',
  es: 'https://flagcdn.com/w80/es.png',
  it: 'https://flagcdn.com/w80/it.png',
  rs: 'https://flagcdn.com/w80/rs.png',
  no: 'https://flagcdn.com/w80/no.png',
  ru: 'https://flagcdn.com/w80/ru.png',
  de: 'https://flagcdn.com/w80/de.png',
  us: 'https://flagcdn.com/w80/us.png',
};

export const PRONOS_FIXTURES: Prono[] = [
  // ========== PASSÉ J-3 ==========
  {
    id: 'h1',
    sport: 'foot',
    competition: 'Ligue 1 · J29',
    teamHome: 'Lille',
    teamAway: 'Rennes',
    teamHomeLogo: LOGO.lille,
    teamAwayLogo: LOGO.rennes,
    matchStartAt: minus3At(21, 0),
    prediction: 'Victoire Lille',
    odd: 1.95,
    confidence: 3,
    reasoning: 'Forme à domicile + bon bilan H2H.',
    minTier: 'starter',
    publishedAt: minus3At(10, 0),
    result: 'win',
    finalScore: 'Lille 2-0 Rennes',
  },

  // ========== PASSÉ J-2 ==========
  {
    id: 'h2',
    sport: 'foot',
    competition: 'Premier League · J36',
    teamHome: 'Liverpool',
    teamAway: 'Chelsea',
    teamHomeLogo: LOGO.liverpool,
    teamAwayLogo: LOGO.chelsea,
    matchStartAt: minus2At(17, 30),
    prediction: 'Plus de 2,5 buts',
    odd: 1.78,
    confidence: 4,
    reasoning: 'Deux attaques en forme, défenses perméables.',
    minTier: 'pro',
    publishedAt: minus2At(8, 0),
    result: 'win',
    finalScore: 'Liverpool 3-2 Chelsea',
  },
  {
    id: 'h3',
    sport: 'tennis',
    competition: 'ATP Madrid · 1/8 finale',
    teamHome: 'Zverev (GER)',
    teamAway: 'Medvedev (RUS)',
    teamHomeLogo: FLAG.de,
    teamAwayLogo: FLAG.ru,
    matchStartAt: minus2At(14, 0),
    prediction: 'Victoire Zverev',
    odd: 2.1,
    confidence: 3,
    reasoning: 'Surface favorable + H2H récent en faveur de Zverev.',
    minTier: 'pro',
    publishedAt: minus2At(8, 0),
    result: 'loss',
    finalScore: 'Zverev 1-2 Medvedev',
  },

  // ========== PASSÉ J-1 (hier) ==========
  {
    id: 'h4',
    sport: 'foot',
    competition: 'La Liga · J34',
    teamHome: 'Barcelona',
    teamAway: 'Real Madrid',
    teamHomeLogo: LOGO.barcelona,
    teamAwayLogo: LOGO.realMadrid,
    matchStartAt: yesterdayAt(21, 0),
    prediction: 'Match nul',
    odd: 3.4,
    confidence: 3,
    reasoning: 'Clásico très ouvert, les deux équipes ne peuvent pas perdre.',
    minTier: 'starter',
    publishedAt: yesterdayAt(9, 0),
    result: 'loss',
    finalScore: 'Barcelona 2-1 Real Madrid',
  },
  {
    id: 'h5',
    sport: 'foot',
    competition: 'Ligue 1 · J31',
    teamHome: 'PSG',
    teamAway: 'Monaco',
    teamHomeLogo: LOGO.psg,
    teamAwayLogo: LOGO.monaco,
    matchStartAt: yesterdayAt(17, 0),
    prediction: 'Victoire PSG + Plus 1,5 buts',
    odd: 1.55,
    confidence: 5,
    reasoning: 'Combiné sécurisé — PSG ultra dominant à domicile.',
    minTier: 'vip',
    publishedAt: yesterdayAt(8, 0),
    result: 'win',
    finalScore: 'PSG 4-1 Monaco',
  },

  // ========== AUJOURD'HUI ==========
  {
    id: '1',
    sport: 'foot',
    competition: 'Ligue 1 · J32',
    teamHome: 'PSG',
    teamAway: 'Lyon',
    teamHomeLogo: LOGO.psg,
    teamAwayLogo: LOGO.lyon,
    matchStartAt: todayAt(21, 0),
    prediction: 'Victoire PSG',
    odd: 1.65,
    confidence: 4,
    reasoning:
      'Le PSG reste sur 8 victoires en 10 matchs à domicile cette saison. Lyon vient avec 3 défaites consécutives et trois absents importants. Forme, contexte et profondeur de banc plaident clairement en faveur des Parisiens. Cote acceptable pour une probabilité élevée.',
    minTier: 'starter',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },
  {
    id: '2',
    sport: 'foot',
    competition: 'La Liga · J33',
    teamHome: 'Real Madrid',
    teamAway: 'Barcelona',
    teamHomeLogo: LOGO.realMadrid,
    teamAwayLogo: LOGO.barcelona,
    matchStartAt: todayAt(21, 0),
    prediction: 'Plus de 2,5 buts',
    odd: 1.85,
    confidence: 5,
    reasoning:
      "Sur les 10 derniers Clásicos, 8 ont vu plus de 2,5 buts. Les deux équipes ont une attaque dans le top 3 du championnat et une défense perméable. Vinicius et Lewandowski en pleine forme. La pression d'un titre encore jouable pousse les deux équipes à jouer l'offensive.",
    minTier: 'pro',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },
  {
    id: '3',
    sport: 'tennis',
    competition: 'ATP Rome · 1/4 finale',
    teamHome: 'Alcaraz (ESP)',
    teamAway: 'Sinner (ITA)',
    teamHomeLogo: FLAG.es,
    teamAwayLogo: FLAG.it,
    matchStartAt: todayAt(19, 30),
    prediction: 'Victoire Alcaraz 2-1',
    odd: 3.4,
    confidence: 3,
    reasoning:
      "Match très ouvert entre les deux meilleurs joueurs actuels. Alcaraz a battu Sinner 3 fois sur 5 sur terre battue, mais Sinner est en pleine confiance après ses récents titres. Notre lecture : un match en 3 sets très accroché avec un Alcaraz qui sait mieux gérer les longs échanges sur terre.",
    minTier: 'pro',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },
  {
    id: '4',
    sport: 'foot',
    competition: 'Ligue 1 · J32',
    teamHome: 'Marseille',
    teamAway: 'Monaco',
    teamHomeLogo: LOGO.marseille,
    teamAwayLogo: LOGO.monaco,
    matchStartAt: todayAt(17, 0),
    prediction: 'Les deux équipes marquent',
    odd: 1.72,
    confidence: 4,
    reasoning:
      'Marseille joue toujours offensif au Vélodrome. Monaco a marqué dans 9 de ses 10 derniers déplacements. Les deux équipes ont un bilan défensif moyen. Probabilité élevée de voir au moins 1 but de chaque côté.',
    minTier: 'starter',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },

  // ========== DEMAIN ==========
  {
    id: '5',
    sport: 'tennis',
    competition: 'ATP Rome · 1/2 finale',
    teamHome: 'Djokovic (SRB)',
    teamAway: 'Ruud (NOR)',
    teamHomeLogo: FLAG.rs,
    teamAwayLogo: FLAG.no,
    matchStartAt: tomorrowAt(15, 0),
    prediction: 'Victoire Djokovic',
    odd: 1.4,
    confidence: 4,
    reasoning:
      'Djokovic mène le H2H 5-2 contre Ruud. Le Serbe est en grande forme et le format des 1/2 finales en 3 sets favorise les têtes de série. Cote faible mais sécurisée.',
    minTier: 'pro',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },
  {
    id: '6',
    sport: 'foot',
    competition: 'Champions League · 1/2 retour',
    teamHome: 'Man City',
    teamAway: 'Arsenal',
    teamHomeLogo: LOGO.manCity,
    teamAwayLogo: LOGO.arsenal,
    matchStartAt: tomorrowAt(21, 0),
    prediction: 'Victoire Man City + Plus 2,5 buts',
    odd: 2.8,
    confidence: 5,
    reasoning:
      "Combiné maison VIP : City à domicile en demi de Ligue des Champions reste l'un des paris les plus solides de la saison. Arsenal devra prendre des risques après le 1-0 à l'aller. Match avec beaucoup d'enjeu et de buts attendus.",
    minTier: 'vip',
    publishedAt: new Date().toISOString(),
    result: 'pending',
  },
];
