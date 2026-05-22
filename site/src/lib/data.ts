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
  { href: "/#methode", label: "Methode" },
  { href: "/#pronos", label: "Pronos" },
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
    alt: "Étape 03 — Livraison : tu reçois le verdict sur WhatsApp (envoi direct, 0 spam, notif claire avec pari et raisonnement)",
    eyebrow: "Livraison",
    title: "Tu reçois le verdict sur WhatsApp",
    body: "Notification avec le pari, le raisonnement, la mise conseillée et la cote minimale acceptable. Pas de canal Telegram bondé, pas de spam — une conversation propre, sur la messagerie que tu utilises tous les jours.",
    tags: ["WhatsApp", "Notif direct", "0 spam"],
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
  /* Image du prono (screenshot WhatsApp ou graphic designé).
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
  fevrier:  { roi: 21.7, gains: "+462,10 €", losses: "-148,20 €", avgOdd: "1.91", total: 34, wins: 23, losses_count: 11 },
  mars:     { roi: 134.1, gains: "+1 247,57 €", losses: "-112,00 €", avgOdd: "2.96", total: 24, wins: 19, losses_count: 5 },
  avril:    { roi: 24.3, gains: "+512,90 €", losses: "-162,80 €", avgOdd: "1.95", total: 36, wins: 25, losses_count: 11 },
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

  // ===== AVRIL =====
  { day: "30", month: "avril", match: "Naples - Bologne",     prediction: "Plus de 2.5 buts",     odd: "1.80", result: "win",  sport: "foot" },
  { day: "28", month: "avril", match: "Djokovic - Alcaraz",   prediction: "Match en 3 sets",      odd: "1.95", result: "win",  sport: "tennis" },
  { day: "27", month: "avril", match: "Lakers - Warriors",    prediction: "Lakers +5.5 handicap", odd: "1.88", result: "win",  sport: "basket" },
  { day: "25", month: "avril", match: "Bayern - Stuttgart",   prediction: "Bayern -1.5",          odd: "1.72", result: "loss", sport: "foot" },
  { day: "24", month: "avril", match: "Man City - Brighton",  prediction: "Victoire City",        odd: "1.32", result: "win",  sport: "foot" },
  { day: "22", month: "avril", match: "Juventus - Milan",     prediction: "Moins de 2.5 buts",    odd: "1.85", result: "win",  sport: "foot" },
  { day: "20", month: "avril", match: "Sinner - Medvedev",    prediction: "Victoire Sinner",      odd: "1.65", result: "win",  sport: "tennis" },
  { day: "18", month: "avril", match: "Boston - Miami",       prediction: "Plus de 215.5 pts",    odd: "1.90", result: "loss", sport: "basket" },
  { day: "15", month: "avril", match: "PSG - Marseille",      prediction: "Plus de 2.5 buts",     odd: "1.75", result: "win",  sport: "foot" },
  { day: "12", month: "avril", match: "Chelsea - Tottenham",  prediction: "Les deux équipes marquent", odd: "1.62", result: "win",  sport: "foot" },

  // ===== MARS (24 paris avec screenshots Winamax — 19 wins, 5 losses, ROI 134%) =====
  { day: "31", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.85", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-01.jpg" },
  { day: "30", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.95", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-02.jpg" },
  { day: "29", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.20", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-03.jpg" },
  { day: "28", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.45", result: "loss", sport: "basket", image: "/decorations/pronos/mars/mars-04.jpg" },
  { day: "27", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.10", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-05.jpg" },
  { day: "25", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.40", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-06.jpg" },
  { day: "24", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.65", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-07.jpg" },
  { day: "23", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.75", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-08.jpg" },
  { day: "22", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.20", result: "loss", sport: "foot",   image: "/decorations/pronos/mars/mars-09.jpg" },
  { day: "21", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.85", result: "win",  sport: "mma",    image: "/decorations/pronos/mars/mars-10.jpg" },
  { day: "20", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.30", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-11.jpg" },
  { day: "19", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.40", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-12.jpg" },
  { day: "18", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.75", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-13.jpg" },
  { day: "17", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.95", result: "loss", sport: "basket", image: "/decorations/pronos/mars/mars-14.jpg" },
  { day: "16", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "1.95", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-15.jpg" },
  { day: "15", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "5.10", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-16.jpg" },
  { day: "13", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.25", result: "win",  sport: "tennis", image: "/decorations/pronos/mars/mars-17.jpg" },
  { day: "12", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.55", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-18.jpg" },
  { day: "10", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.65", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-19.jpg" },
  { day: "09", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "2.85", result: "loss", sport: "tennis", image: "/decorations/pronos/mars/mars-20.jpg" },
  { day: "07", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "3.60", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-21.jpg" },
  { day: "06", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "2.10", result: "win",  sport: "basket", image: "/decorations/pronos/mars/mars-22.jpg" },
  { day: "04", month: "mars", match: "Combiné multi-paris", prediction: "Combiné perdant", odd: "3.15", result: "loss", sport: "foot",   image: "/decorations/pronos/mars/mars-23.jpg" },
  { day: "02", month: "mars", match: "Combiné multi-paris", prediction: "Combiné gagnant", odd: "4.30", result: "win",  sport: "foot",   image: "/decorations/pronos/mars/mars-24.jpg" },

  // ===== FÉVRIER =====
  { day: "27", month: "fevrier", match: "Brest - Lyon",       prediction: "Victoire Lyon",        odd: "2.05", result: "win",  sport: "foot" },
  { day: "24", month: "fevrier", match: "PSG - Monaco",       prediction: "Plus de 2.5 buts",     odd: "1.70", result: "win",  sport: "foot" },
  { day: "21", month: "fevrier", match: "Bayern - Leipzig",   prediction: "Bayern & +2.5 buts",   odd: "2.10", result: "win",  sport: "foot" },
  { day: "18", month: "fevrier", match: "Alcaraz - Zverev",   prediction: "Victoire Alcaraz",     odd: "1.50", result: "win",  sport: "tennis" },
  { day: "15", month: "fevrier", match: "Inter - Lazio",      prediction: "Inter -1.5",           odd: "2.30", result: "loss", sport: "foot" },
  { day: "12", month: "fevrier", match: "Chelsea - Aston Villa", prediction: "Match nul",        odd: "3.40", result: "win",  sport: "foot" },
  { day: "09", month: "fevrier", match: "Sevilla - Atlético", prediction: "Moins de 2.5 buts",    odd: "1.82", result: "win",  sport: "foot" },
  { day: "06", month: "fevrier", match: "Boston - LA Lakers", prediction: "Plus de 220 pts",      odd: "1.95", result: "win",  sport: "basket" },
  { day: "03", month: "fevrier", match: "Tottenham - Wolves", prediction: "Victoire Tottenham",   odd: "1.55", result: "loss", sport: "foot" },

  // ===== JANVIER (30 paris avec screenshots Winamax) =====
  { day: "30", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.63", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-01.jpg" },
  { day: "29", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.20", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-02.jpg" },
  { day: "28", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.10", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-03.jpg" },
  { day: "27", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.85", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-04.jpg" },
  { day: "26", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.22", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-05.jpg" },
  { day: "25", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "7.22", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-06.jpg" },
  { day: "24", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné perdant",  odd: "3.45", result: "loss", sport: "foot",   image: "/decorations/pronos/janvier/jan-07.jpg" },
  { day: "23", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.10", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-08.jpg" },
  { day: "22", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.22", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-09.jpg" },
  { day: "21", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.95", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-10.jpg" },
  { day: "20", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.50", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-11.jpg" },
  { day: "19", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.10", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-12.jpg" },
  { day: "18", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.65", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-13.jpg" },
  { day: "17", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.30", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-14.jpg" },
  { day: "16", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.80", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-15.jpg" },
  { day: "15", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.85", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-16.jpg" },
  { day: "14", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné perdant",  odd: "2.95", result: "loss", sport: "foot",   image: "/decorations/pronos/janvier/jan-17.jpg" },
  { day: "13", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.75", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-18.jpg" },
  { day: "12", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.45", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-19.jpg" },
  { day: "11", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "5.60", result: "win",  sport: "mma",    image: "/decorations/pronos/janvier/jan-20.jpg" },
  { day: "10", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "4.20", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-21.jpg" },
  { day: "09", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "1.85", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-22.jpg" },
  { day: "08", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "3.10", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-23.jpg" },
  { day: "07", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "6.40", result: "win",  sport: "foot",   image: "/decorations/pronos/janvier/jan-24.jpg" },
  { day: "06", month: "janvier", match: "Combiné multi-paris", prediction: "Cashout 17,91 €",  odd: "5.63", result: "win",  sport: "tennis", image: "/decorations/pronos/janvier/jan-25.jpg" },
  { day: "05", month: "janvier", match: "Combiné multi-paris", prediction: "Combiné gagnant",  odd: "2.30", result: "win",  sport: "basket", image: "/decorations/pronos/janvier/jan-26.jpg" },
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
    name: "Decouverte",
    tier: "bronze",
    abbr: "DEC",
    icon: "🎯",
    cardImage: "/decorations/pricing/decouverte-frame.png",
    monthly: "Gratuit",
    yearly: "Gratuit",
    hintMonthly: "Pour tester.",
    hintYearly: "Pour tester.",
    isFree: true,
    features: [
      { text: "1 prono foot / jour", strong: true, icon: "Goal" },
      { text: "Sans inscription", icon: "UserX" },
      { text: "Notification web", icon: "Bell" },
    ],
    stats: [
      { abbr: "PRO", value: "1" },
      { abbr: "SPO", value: "1" },
      { abbr: "WHA", value: "—" },
      { abbr: "APP", value: "—" },
      { abbr: "HIS", value: "—" },
      { abbr: "VIP", value: "—" },
    ],
    ctaLabel: "Commencer",
    ctaVariant: "secondary",
  },
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
      { text: "Tous les pronos foot\n(3 a 5 / jour)", strong: true, icon: "Goal" },
      { text: "Acces app & espace membre", icon: "Smartphone" },
      { text: "Alertes push WhatsApp", icon: "MessageCircle" },
      { text: "Historique complet", icon: "History" },
    ],
    stats: [
      { abbr: "PRO", value: "5" },
      { abbr: "SPO", value: "1" },
      { abbr: "WHA", value: "✓" },
      { abbr: "APP", value: "✓" },
      { abbr: "HIS", value: "✓" },
      { abbr: "VIP", value: "—" },
    ],
    ctaLabel: "Choisir Starter",
    ctaVariant: "primary",
    featured: true,
    badge: "Le plus populaire",
  },
  {
    name: "Pro",
    tier: "gold",
    abbr: "PRO",
    icon: "💎",
    cardImage: "/decorations/pricing/pro-frame.png",
    monthly: "24,90 €",
    yearly: "239,00 €",
    hintMonthly: "Sans engagement",
    hintYearly: "Facture annuellement",
    features: [
      { text: "Multi-sports :\nfoot, tennis, basket", strong: true, icon: "Trophy" },
      { text: "Value bets identifies\npar notre analyste", icon: "TrendingUp" },
      { text: "Analyse detaillee\nde chaque pari", icon: "FileSearch" },
      { text: "Stats personnalisees", icon: "BarChart3" },
    ],
    stats: [
      { abbr: "PRO", value: "5+" },
      { abbr: "SPO", value: "3" },
      { abbr: "WHA", value: "✓" },
      { abbr: "APP", value: "✓" },
      { abbr: "ANA", value: "✓" },
      { abbr: "VIP", value: "—" },
    ],
    ctaLabel: "Choisir Pro",
    ctaVariant: "secondary",
  },
  {
    name: "VIP",
    tier: "special",
    abbr: "VIP",
    icon: "👑",
    cardImage: "/decorations/pricing/vip-frame.png",
    monthly: "59,00 €",
    yearly: "566,00 €",
    hintMonthly: "50 places max",
    hintYearly: "50 places max — annuel",
    features: [
      { text: "Canal WhatsApp prive", strong: true, icon: "MessageCircle" },
      { text: "Gros evenements (Ligue des Champions, finales)", icon: "Trophy" },
      { text: "ROI tracking personnalise", icon: "TrendingUp" },
      { text: "Ligne directe avec l'analyste", icon: "Headphones" },
    ],
    stats: [
      { abbr: "PRO", value: "8+" },
      { abbr: "SPO", value: "5" },
      { abbr: "WHA", value: "★" },
      { abbr: "APP", value: "✓" },
      { abbr: "ANA", value: "★" },
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
      "Sur WhatsApp directement (notification), ou dans ton espace membre sur le site.",
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

