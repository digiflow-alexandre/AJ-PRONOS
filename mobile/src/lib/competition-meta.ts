import type { Sport } from '@/types/prono';

/**
 * Mapping compétition → pays (drapeau) + SF Symbol sport.
 * Étendre quand on ajoutera de nouvelles compétitions.
 */

// Pour matcher juste le début du nom de la compétition (ex: "Ligue 1 · J32" → "Ligue 1")
const COMPETITION_COUNTRY: { match: string; iso: string }[] = [
  { match: 'Ligue 1', iso: 'fr' },
  { match: 'La Liga', iso: 'es' },
  { match: 'Premier League', iso: 'gb' },
  { match: 'Bundesliga', iso: 'de' },
  { match: 'Serie A', iso: 'it' },
  { match: 'Champions League', iso: 'eu' },
  { match: 'Europa League', iso: 'eu' },
  { match: 'ATP Rome', iso: 'it' },
  { match: 'ATP Madrid', iso: 'es' },
  { match: 'ATP Paris', iso: 'fr' },
  { match: 'Roland-Garros', iso: 'fr' },
  { match: 'Wimbledon', iso: 'gb' },
  { match: 'US Open', iso: 'us' },
  { match: 'Australian Open', iso: 'au' },
];

export function getCompetitionFlag(competition: string): string | null {
  const entry = COMPETITION_COUNTRY.find((c) => competition.startsWith(c.match));
  if (!entry) return null;
  return `https://flagcdn.com/w80/${entry.iso}.png`;
}

export function getSportSymbol(sport: Sport): string {
  return sport === 'foot' ? 'soccerball' : 'tennisball';
}

// Couleurs des balles : forcées en mono pour fiabiliser le rendu
// (le mode multicolor de SF Symbols est parfois fantaisiste — la balle
// de tennis sortait en bleu).
export const SPORT_COLOR: Record<Sport, string> = {
  foot: '#0A0A0A',      // noir classique
  tennis: '#D4FF00',    // jaune fluo balle de tennis
};

// Couleur signature de chaque compétition — utilisée comme filet de bord
// autour de la card prono pour identifier visuellement le championnat.
const COMPETITION_COLOR: { match: string; color: string }[] = [
  { match: 'Ligue 1', color: '#091C3E' },          // bleu nuit
  { match: 'La Liga', color: '#EE3524' },          // rouge
  { match: 'Premier League', color: '#37003C' },   // violet
  { match: 'Bundesliga', color: '#D20515' },       // rouge BL
  { match: 'Serie A', color: '#008FD7' },          // bleu Serie A
  { match: 'Champions League', color: '#00185A' }, // bleu marine UCL
  { match: 'Europa League', color: '#FF7A00' },    // orange UEL
  { match: 'Conference League', color: '#00C982' },// vert UECL
  { match: 'Roland-Garros', color: '#C8430C' },    // orange terre battue
  { match: 'ATP Rome', color: '#C8430C' },         // terre battue
  { match: 'ATP Madrid', color: '#005CA9' },       // bleu Mutua
  { match: 'ATP Paris', color: '#1B3D8E' },        // bleu Paris
  { match: 'Wimbledon', color: '#006F36' },        // vert herbe
  { match: 'US Open', color: '#0B4A8C' },          // bleu navy
  { match: 'Australian Open', color: '#37C5D7' },  // bleu cyan
];

export function getCompetitionColor(competition: string): string {
  const entry = COMPETITION_COLOR.find((c) => competition.startsWith(c.match));
  return entry?.color ?? '#C5B7A5'; // fallback : crème un peu doré
}

/** Combien de jours d'historique de pronos un user peut consulter. */
export function getMaxHistoryDays(
  tier: 'trial' | 'starter' | 'pro' | 'vip' | null,
  isTrialActive: boolean,
): number {
  if (isTrialActive) return Infinity;
  if (!tier) return 0;
  switch (tier) {
    case 'trial':
      return 0; // trial échu
    case 'starter':
      return 7;
    case 'pro':
      return 30;
    case 'vip':
      return Infinity;
  }
}
