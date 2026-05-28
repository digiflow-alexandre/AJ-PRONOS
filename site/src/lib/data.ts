/**
 * AJ Pronos — données statiques typées
 * Source de vérité pour pricing, paris, FAQ, etc.
 */

// ============ NAV ============
export interface NavLink {
  href: string;
  label: string;
}

export const navLinks: NavLink[] = [
  { href: "/methode", label: "Methode" },
  { href: "/resultats", label: "Resultats" },
  { href: "/#tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

// ============ STATS ============
export interface Stat {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  accent?: boolean;
}

export const stats: Stat[] = [
  { value: 18.4, label: "ROI 30 jours", prefix: "+", suffix: "%", decimals: 1, accent: true },
  { value: 1240, label: "Paris analyses", suffix: "+" },
  { value: 340, label: "Membres actifs" },
];

// ============ METHODE (3 etapes) ============
export interface MethodStep {
  number: string;
  /* Si présent, on affiche l'image directement (card gaming custom).
     Sinon on rend le design CSS simple à partir du contenu structuré. */
  image?: string;
  alt?: string;
  /* Contenu fallback / placeholder en attendant l'image générée */
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
}

export const methodSteps: MethodStep[] = [
  {
    number: "01",
    image: "/decorations/method-card-01.png",
    alt: "Étape 01 — Collecte : on scanne toute la data du match (compositions, blessures, head-to-head, cotes en temps réel)",
    eyebrow: "Collecte",
    title: "On scanne toute la data du match",
    body: "Compositions à jour 1h avant le coup d'envoi, blessures, suspensions, forme récente, head-to-head sur 5 ans, cotes en temps réel chez les bookmakers. Tout est consolidé en un seul écran.",
    tags: ["Compos live", "5 ans H2H", "Cotes RT"],
  },
  {
    number: "02",
    image: "/decorations/method-card-02.png",
    alt: "Étape 02 — Filtre humain : on tranche à la main, pari par pari (analyse manuelle, sélectivité ≤ 1 sur 3, anti-filler)",
    eyebrow: "Filtre humain",
    title: "On tranche à la main, pari par pari",
    body: "Chaque pari potentiel est analysé manuellement. Contexte tactique, dynamique d'équipe, intuition forgée par 10 ans d'analyses. On ne publie que ce en quoi on croit vraiment.",
    tags: ["Filtre humain", "≤ 1 sur 3", "Anti-filler"],
  },
  {
    number: "03",
    image: "/decorations/method-card-03.png",
    alt: "Étape 03 — Livraison : tu reçois le verdict dans l'app (notification push, 0 spam, pari clair avec raisonnement)",
    eyebrow: "Livraison",
    title: "Tu reçois le verdict dans l'app",
    body: "Notification push directe avec le pari, le raisonnement, la mise conseillée et la cote minimale acceptable. Pari publié 1h avant le coup d'envoi pour intégrer les compositions officielles. Tout reste dans l'app : zéro canal externe, zéro spam.",
    tags: ["Notif in-app", "1h avant match", "0 spam"],
  },
];

// ============ BETS list ============
export type BetMonth = "janvier" | "fevrier" | "mars" | "avril" | "mai";
export interface Bet {
  day: string; // "11" jour du mois
  month: BetMonth;
  match: string;
  prediction: string;
  odd: string;
  result: "win" | "loss";
  sport?: "foot" | "tennis" | "basket" | "mma";
  /* Image du prono (screenshot Winamax ou graphic designé).
     Si absent : on affiche une tuile design générée. */
  image?: string;
}

export interface MonthSummary {
  roi: number;       // % ROI sur le mois
  gains: string;     // ex : "+412,80 €"
  losses: string;    // ex : "-188,40 €"
  avgOdd: string;    // ex : "1.87"
  total: number;     // nb total de paris
  wins: number;
  losses_count: number;
}

export const monthsList: { key: BetMonth; label: string; short: string }[] = [
  { key: "janvier",  label: "Janvier",  short: "Jan" },
  { key: "fevrier",  label: "Février",  short: "Fév" },
  { key: "mars",     label: "Mars",     short: "Mar" },
  { key: "avril",    label: "Avril",    short: "Avr" },
  { key: "mai",      label: "Mai",      short: "Mai" },
];

export const monthlySummary: Record<BetMonth, MonthSummary> = {
  janvier:  { roi: 165.5, gains: "+1 916,16 €", losses: "-72,18 €", avgOdd: "2.95", total: 30, wins: 27, losses_count: 3 },
  fevrier:  { roi: 133.8, gains: "+788,40 €", losses: "-74,19 €", avgOdd: "3.00", total: 18, wins: 14, losses_count: 4 },
  mars:     { roi: 134.1, gains: "+1 247,57 €", losses: "-112,00 €", avgOdd: "2.96", total: 24, wins: 19, losses_count: 5 },
  avril:    { roi: 79.6, gains: "+1 329,89 €", losses: "-170,87 €", avgOdd: "2.34", total: 26, wins: 20, losses_count: 6 },
  mai:      { roi: 18.4, gains: "+412,80 €", losses: "-188,40 €", avgOdd: "1.87", total: 42, wins: 28, losses_count: 14 },
};

export const bets: Bet[] = [
  // ===== MAI =====
  { day: "11", month: "mai", match: "PSG - Lyon",            prediction: "Plus de 2.5 buts",     odd: "1.78", result: "win",  sport: "foot" },
  { day: "10", month: "mai", match: "Real Madrid - Girona",   prediction: "Victoire Real",        odd: "1.42", result: "win",  sport: "foot" },
  { day: "09", month: "mai", match: "Bayer - Roma",           prediction: "Les deux équipes marquent", odd: "1.95", result: "loss", sport: "foot" },
  { day: "08", month: "mai", match: "Arsenal - Chelsea",      prediction: "Victoire Arsenal",     odd: "1.65", result: "win",  sport: "foot" },
  { day: "07", month: "mai", match: "Atlético - Athletic",    prediction: "Moins de 3.5 buts",    odd: "1.58", result: "win",  sport: "foot" },
  { day: "06", month: "mai", match: "Marseille - Nice",       prediction: "Victoire OM",          odd: "2.10", result: "loss", sport: "foot" },
  { day: "05", month: "mai", match: "Inter - Torino",         prediction: "Plus de 2.5 buts",     odd: "1.72", result: "win",  sport: "foot" },
  { day: "04", month: "mai", match: "Liverpool - Tottenham",  prediction: "Liverpool & +2.5",     odd: "2.20", result: "win",  sport: "foot" },
  { day: "03", month: "mai", match: "Dortmund - Mainz",       prediction: "Victoire Dortmund",    odd: "1.50", result: "win",  sport: "foot" },
  { day: "02", month: "mai", match: "Lille - Lens",           prediction: "Match nul ou Lens",    odd: "1.92", result: "loss", sport: "foot" },
  { day: "01", month: "mai", match: "Barcelone - Valence",    prediction: "Victoire Barça -1.5",  odd: "2.05", result: "win",  sport: "foot" },

  // ===== AVRIL (26 paris avec screenshots Winamax — stats globales à confirmer Alex) =====
  { day: "30", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.40", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-01.jpg" },
  { day: "29", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.75", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-02.jpg" },
  { day: "28", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.20", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-03.jpg" },
  { day: "27", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.10", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-04.jpg" },
  { day: "26", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.95", result: "loss", sport: "tennis", image: "/decorations/pronos/avril/avril-05.jpg" },
  { day: "25", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.40", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-06.jpg" },
  { day: "24", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.30", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-07.jpg" },
  { day: "23", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.65", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-08.jpg" },
  { day: "22", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "1.95", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-09.jpg" },
  { day: "21", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.20", result: "loss", sport: "foot",   image: "/decorations/pronos/avril/avril-10.jpg" },
  { day: "20", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.85", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-11.jpg" },
  { day: "19", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.55", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-12.jpg" },
  { day: "18", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.95", result: "loss", sport: "foot",   image: "/decorations/pronos/avril/avril-13.jpg" },
  { day: "17", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.10", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-14.jpg" },
  { day: "16", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.10", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-15.jpg" },
  { day: "15", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.45", result: "loss", sport: "foot",   image: "/decorations/pronos/avril/avril-16.jpg" },
  { day: "14", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.85", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-17.jpg" },
  { day: "13", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.30", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-18.jpg" },
  { day: "12", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.75", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-19.jpg" },
  { day: "11", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.45", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-20.jpg" },
  { day: "10", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.60", result: "win",  sport: "tennis", image: "/decorations/pronos/avril/avril-21.jpg" },
  { day: "08", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.30", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-22.jpg" },
  { day: "07", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.70", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-23.jpg" },
  { day: "05", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.85", result: "loss", sport: "tennis", image: "/decorations/pronos/avril/avril-24.jpg" },
  { day: "03", month: "avril", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "4.50", result: "loss", sport: "foot",   image: "/decorations/pronos/avril/avril-25.jpg" },
  { day: "01", month: "avril", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.20", result: "win",  sport: "foot",   image: "/decorations/pronos/avril/avril-26.jpg" },

  // ===== MARS (24 paris avec screenshots Winamax — 19 wins, 5 losses, ROI 134%) =====
  { day: "31", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.85", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-01.jpg" },
  { day: "30", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.95", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-02.jpg" },
  { day: "29", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.20", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-03.jpg" },
  { day: "28", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.45", result: "loss", sport: "foot", image: "/decorations/pronos/mars/mars-04.jpg" },
  { day: "27", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.10", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-05.jpg" },
  { day: "25", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.40", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-06.jpg" },
  { day: "24", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.65", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-07.jpg" },
  { day: "23", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.75", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-08.jpg" },
  { day: "22", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.20", result: "loss", sport: "foot",   image: "/decorations/pronos/mars/mars-09.jpg" },
  { day: "21", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.85", result: "win",  sport: "tennis",    image: "/decorations/pronos/mars/mars-10.jpg" },
  { day: "20", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.30", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-11.jpg" },
  { day: "19", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.40", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-12.jpg" },
  { day: "18", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.75", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-13.jpg" },
  { day: "17", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.95", result: "loss", sport: "foot", image: "/decorations/pronos/mars/mars-14.jpg" },
  { day: "16", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "1.95", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-15.jpg" },
  { day: "15", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.10", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-16.jpg" },
  { day: "13", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.25", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-17.jpg" },
  { day: "12", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.55", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-18.jpg" },
  { day: "10", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.65", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-19.jpg" },
  { day: "09", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.85", result: "loss", sport: "tennis", image: "/decorations/pronos/mars/mars-20.jpg" },
  { day: "07", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.60", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-21.jpg" },
  { day: "06", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.10", result: "win",  sport: "foot", image: "/decorations/pronos/mars/mars-22.jpg" },
  { day: "04", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.15", result: "loss", sport: "foot",   image: "/decorations/pronos/mars/mars-23.jpg" },
  { day: "02", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.30", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-24.jpg" },

  // ===== FÉVRIER (18 paris avec screenshots Winamax — 14 wins, 4 losses, ROI 134%) =====
  { day: "28", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.10", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-01.jpg" },
  { day: "27", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.25", result: "win",  sport: "tennis", image: "/decorations/pronos/fevrier/fevrier-02.jpg" },
  { day: "26", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.85", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-03.jpg" },
  { day: "24", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.20", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-04.jpg" },
  { day: "22", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.40", result: "loss", sport: "foot", image: "/decorations/pronos/fevrier/fevrier-05.jpg" },
  { day: "21", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.65", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-06.jpg" },
  { day: "19", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.50", result: "win",  sport: "tennis", image: "/decorations/pronos/fevrier/fevrier-07.jpg" },
  { day: "18", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.10", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-08.jpg" },
  { day: "16", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.45", result: "loss", sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-09.jpg" },
  { day: "15", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.80", result: "win",  sport: "tennis",    image: "/decorations/pronos/fevrier/fevrier-10.jpg" },
  { day: "14", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.20", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-11.jpg" },
  { day: "12", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.50", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-12.jpg" },
  { day: "10", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.90", result: "loss", sport: "foot", image: "/decorations/pronos/fevrier/fevrier-13.jpg" },
  { day: "09", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.95", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-14.jpg" },
  { day: "08", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "1.95", result: "win",  sport: "tennis", image: "/decorations/pronos/fevrier/fevrier-15.jpg" },
  { day: "06", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.85", result: "win",  sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-16.jpg" },
  { day: "04", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.05", result: "loss", sport: "foot",   image: "/decorations/pronos/fevrier/fevrier-17.jpg" },
  { day: "02", month: "fevrier", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.55", result: "win",  sport: "tennis", image: "/decorations/pronos/fevrier/fevrier-18.jpg" },

  // ===== JANVIER (30 paris avec screenshots Winamax) =====
  { day: "30", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.63", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-01.jpg" },
  { day: "29", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.20", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-02.jpg" },
  { day: "28", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.10", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-03.jpg" },
  { day: "27", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.85", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-04.jpg" },
  { day: "26", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.22", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-05.jpg" },
  { day: "25", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "7.22", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-06.jpg" },
  { day: "24", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné perdant",  odd: "3.45", result: "loss", sport: "foot",   image: "/decorations/pronos/janvier/jan-07.jpg" },
  { day: "23", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.10", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-08.jpg" },
  { day: "22", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.22", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-09.jpg" },
  { day: "21", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.95", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-10.jpg" },
  { day: "20", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.50", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-11.jpg" },
  { day: "19", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.10", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-12.jpg" },
  { day: "18", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.65", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-13.jpg" },
  { day: "17", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.30", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-14.jpg" },
  { day: "16", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.80", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-15.jpg" },
  { day: "15", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.85", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-16.jpg" },
  { day: "14", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné perdant",  odd: "2.95", result: "loss", sport: "foot",   image: "/decorations/pronos/janvier/jan-17.jpg" },
  { day: "13", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.75", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-18.jpg" },
  { day: "12", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.45", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-19.jpg" },
  { day: "11", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.60", result: "win",  sport: "tennis",    image: "/decorations/pronos/janvier/jan-20.jpg" },
  { day: "10", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.20", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-21.jpg" },
  { day: "09", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.85", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-22.jpg" },
  { day: "08", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.10", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-23.jpg" },
  { day: "07", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.40", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-24.jpg" },
  { day: "06", month: "janvier", match: "Combiné multi-paris", prediction: "Cashout 17,91 €",  odd: "5.63", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-25.jpg" },
  { day: "05", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.30", result: "win",  sport: "foot", image: "/decorations/pronos/janvier/jan-26.jpg" },
  { day: "04", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné perdant",  odd: "3.55", result: "loss", sport: "foot",   image: "/decorations/pronos/janvier/jan-27.jpg" },
  { day: "03", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.95", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-28.jpg" },
  { day: "02", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.20", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-29.jpg" },
  { day: "01", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.85", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-30.jpg" },
];

// ============ PRICING ============
export interface PricingFeature {
  text: string;
  strong?: boolean;
  /** Nom d'icône Lucide rendue dans la puce. Cf. iconMap dans Pricing.tsx. */
  icon?: string;
}

/* FUT-style stats : libellé court (3 lettres) + valeur compacte */
export interface PricingStat {
  abbr: string;   // ex: "PRO", "SPO", "WHA"
  value: string;  // ex: "5", "✓", "—", "★"
}

export type PricingTier = "bronze" | "silver" | "gold" | "special";

export interface PricingPlan {
  name: string;
  tier: PricingTier;
  abbr: string;   // ex: "DEC", "STA", "PRO", "VIP"
  icon: string;   // emoji central
  /* Image FUT frame générée — utilisée comme bg de la card. Si absent, fallback CSS. */
  cardImage?: string;
  monthly: string;
  yearly: string;
  hintMonthly: string;
  hintYearly: string;
  isFree?: boolean;
  features: PricingFeature[];
  stats: PricingStat[]; // 6 stats FUT-style
  ctaLabel: string;
  ctaVariant: "primary" | "secondary";
  featured?: boolean;
  badge?: string;
}

export const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    tier: "silver",
    abbr: "STA",
    icon: "📊",
    cardImage: "/decorations/pricing/starter-frame.png",
    monthly: "9,90 €",
    yearly: "95,00 €",
    hintMonthly: "Sans engagement",
    hintYearly: "Facture annuellement",
    features: [
      { text: "Pronos veille (J-1)\n+ 1 prono jour J", strong: true, icon: "Goal" },
      { text: "Acces app & espace membre", icon: "Smartphone" },
      { text: "Notifications push in-app", icon: "Bell" },
      { text: "Historique complet", icon: "History" },
    ],
    stats: [
      { abbr: "PRO", value: "5" },
      { abbr: "SPO", value: "2" },
      { abbr: "APP", value: "✓" },
      { abbr: "HIS", value: "✓" },
      { abbr: "IA", value: "—" },
      { abbr: "VIP", value: "—" },
    ],
    ctaLabel: "Choisir Starter",
    ctaVariant: "secondary",
  },
  {
    name: "Pro",
    tier: "gold",
    abbr: "PRO",
    icon: "💎",
    cardImage: "/decorations/pricing/pro-frame.png",
    monthly: "19,90 €",
    yearly: "191,00 €",
    hintMonthly: "Sans engagement",
    hintYearly: "Facture annuellement",
    features: [
      { text: "Pronos foot & tennis\nen temps reel (J)", strong: true, icon: "Trophy" },
      { text: "Recommandations\npersonnalisees (IA)", icon: "TrendingUp" },
      { text: "Analyse detaillee\nde chaque pari", icon: "FileSearch" },
      { text: "Stats & ROI personnels", icon: "BarChart3" },
    ],
    stats: [
      { abbr: "PRO", value: "5+" },
      { abbr: "SPO", value: "2" },
      { abbr: "APP", value: "✓" },
      { abbr: "ANA", value: "✓" },
      { abbr: "IA", value: "✓" },
      { abbr: "VIP", value: "—" },
    ],
    ctaLabel: "Choisir Pro",
    ctaVariant: "primary",
    featured: true,
    badge: "Le plus populaire",
  },
  {
    name: "VIP",
    tier: "special",
    abbr: "VIP",
    icon: "👑",
    cardImage: "/decorations/pricing/vip-frame.png",
    monthly: "49,90 €",
    yearly: "479,00 €",
    hintMonthly: "50 places max",
    hintYearly: "50 places max — annuel",
    features: [
      { text: "Salon prive in-app\navec l'analyste", strong: true, icon: "MessageCircle" },
      { text: "Reunion hebdo Teams\n(strategie & budget)", icon: "Headphones" },
      { text: "Gros evenements\n(Champions League, finales)", icon: "Trophy" },
      { text: "ROI tracking personnalise", icon: "TrendingUp" },
    ],
    stats: [
      { abbr: "PRO", value: "8+" },
      { abbr: "SPO", value: "2" },
      { abbr: "APP", value: "★" },
      { abbr: "ANA", value: "★" },
      { abbr: "IA", value: "★" },
      { abbr: "VIP", value: "★" },
    ],
    ctaLabel: "Acceder VIP",
    ctaVariant: "secondary",
  },
];

// ============ FAQ ============
export interface FaqItem {
  question: string;
  answer: string;
}

export const faqItems: FaqItem[] = [
  {
    question: "Suis-je sur de gagner ?",
    answer:
      "Non. Aucun pronostiqueur serieux ne le promet. On affiche notre ROI reel, pertes incluses. Le pari sportif reste un risque.",
  },
  {
    question: "C'est legal en France ?",
    answer:
      "Oui. Le conseil en pronostics n'est pas reglemente par l'ANJ (seuls les operateurs de paris le sont). On n'organise pas de paris, on conseille.",
  },
  {
    question: "Comment je recois mon prono ?",
    answer:
      "Dans l'application : notification push directe + affichage dans ton espace membre. Pari publié 1h avant le coup d'envoi du match.",
  },
  {
    question: "Puis-je annuler a tout moment ?",
    answer:
      "Oui. Tous nos packs sont sans engagement, resiliable en 1 clic depuis ton compte.",
  },
  {
    question: "Qui est derriere AJ Pronos ?",
    answer:
      "Une equipe de deux : un profil tech/produit et un analyste avec 10 ans d'experience dans le pari sportif. Deux passionnes qui en avaient marre de parier au feeling. On a fini par systematiser ce qu'on faisait.",
  },
  {
    question: "Combien de pronos par jour ?",
    answer: "Entre 1 (Decouverte) et 5+ multi-sports (Pro/VIP) selon ton pack.",
  },
];

