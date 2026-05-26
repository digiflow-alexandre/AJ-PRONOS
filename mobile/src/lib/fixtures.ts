import type { Prono } from '@/types/prono';

// Helpers pour générer des dates relatives.
// Note : ces fixtures sont temporaires — elles seront remplacées par des
// données Supabase quand les agents IA seront branchés (Phase MVP point 9).
function todayAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function tomorrowAt(hour: number, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// Logos API-Sports CDN (gratuit, sans auth).
// Plus tard : ces URLs viendront directement des données API-Football côté backend.
const LOGO = {
  psg: 'https://media.api-sports.io/football/teams/85.png',
  lyon: 'https://media.api-sports.io/football/teams/80.png',
  marseille: 'https://media.api-sports.io/football/teams/81.png',
  monaco: 'https://media.api-sports.io/football/teams/91.png',
  realMadrid: 'https://media.api-sports.io/football/teams/541.png',
  barcelona: 'https://media.api-sports.io/football/teams/529.png',
  manCity: 'https://media.api-sports.io/football/teams/50.png',
  arsenal: 'https://media.api-sports.io/football/teams/42.png',
};

// Drapeaux pays pour le tennis (flagcdn.com gratuit)
const FLAG = {
  fr: 'https://flagcdn.com/w80/fr.png',
  es: 'https://flagcdn.com/w80/es.png',
  it: 'https://flagcdn.com/w80/it.png',
  rs: 'https://flagcdn.com/w80/rs.png',
  no: 'https://flagcdn.com/w80/no.png',
  ru: 'https://flagcdn.com/w80/ru.png',
};

export const PRONOS_FIXTURES: Prono[] = [
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
      'Sur les 10 derniers Clásicos, 8 ont vu plus de 2,5 buts. Les deux équipes ont une attaque dans le top 3 du championnat et une défense perméable. Vinicius et Lewandowski en pleine forme. La pression d\'un titre encore jouable pousse les deux équipes à jouer l\'offensive.',
    minTier: 'pro',
    publishedAt: new Date().toISOString(),
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
      'Match très ouvert entre les deux meilleurs joueurs actuels. Alcaraz a battu Sinner 3 fois sur 5 sur terre battue, mais Sinner est en pleine confiance après ses récents titres. Notre lecture : un match en 3 sets très accroché avec un Alcaraz qui sait mieux gérer les longs échanges sur terre.',
    minTier: 'pro',
    publishedAt: new Date().toISOString(),
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
  },
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
      'Combiné maison VIP : City à domicile en demi de Ligue des Champions reste l\'un des paris les plus solides de la saison. Arsenal devra prendre des risques après le 1-0 à l\'aller. Match avec beaucoup d\'enjeu et de buts attendus.',
    minTier: 'vip',
    publishedAt: new Date().toISOString(),
  },
];
