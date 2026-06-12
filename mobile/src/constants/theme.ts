import '@/global.css';

import { Platform } from 'react-native';

/**
 * AJ Pronos — palette validée (DESIGN.md).
 * Magazine éditorial premium : crème chaud + noir respirable + or text-safe.
 */
export const Colors = {
  light: {
    bg: '#FAFAF7',
    bgElevated: '#FFFFFF',
    bgDeeper: '#F5F4ED',
    bgWarm: '#FAF6E3',
    text: '#0A0A0A',
    textMuted: '#525252',
    textDim: '#737373',
    gold: '#B8941F',          // accent text-safe AA
    goldDecorative: '#D4AF37', // badges, hover, décoratif
    borderFaint: 'rgba(10, 10, 10, 0.06)',
    borderSoft: 'rgba(10, 10, 10, 0.10)',
    borderStrong: 'rgba(10, 10, 10, 0.18)',
    ctaBg: '#0A0A0A',
    ctaText: '#FAFAF7',
    success: '#047857',
    danger: '#B91C1C',
    // Compat avec composants du template par défaut
    background: '#FAFAF7',
    backgroundElement: '#F5F4ED',
    backgroundSelected: '#FAF6E3',
    textSecondary: '#525252',
    // Miroir des tokens "Card light" dark — en mode light on garde les
    // mêmes valeurs que le bg pour pas casser l'app si on switch un jour.
    bgCardLight: '#FFFFFF',
    bgCardLightInner: '#F5F4ED',
    textOnLight: '#0A0A0A',
    textOnLightMuted: '#525252',
    textOnLightDim: '#737373',
    borderOnLightFaint: 'rgba(10, 10, 10, 0.06)',
    borderOnLightSoft: 'rgba(10, 10, 10, 0.10)',
    goldOnLight: '#B8941F',
  },
  dark: {
    bg: '#0A0A0A',
    bgElevated: '#171717',
    bgDeeper: '#0F0F0F',
    bgWarm: '#1A1610',
    text: '#FAFAF7',
    textMuted: '#A3A3A3',
    textDim: '#737373',
    gold: '#E8C95A',
    goldDecorative: '#D4AF37',
    borderFaint: 'rgba(250, 250, 247, 0.08)',
    borderSoft: 'rgba(250, 250, 247, 0.12)',
    borderStrong: 'rgba(250, 250, 247, 0.20)',
    ctaBg: '#FAFAF7',
    ctaText: '#0A0A0A',
    success: '#10B981',
    danger: '#EF4444',
    background: '#0A0A0A',
    backgroundElement: '#171717',
    backgroundSelected: '#262626',
    textSecondary: '#A3A3A3',
    // Cards crème (refonte DA 2026-06-04) — utilisé pour les cards
    // "primaires" sur fond noir (genre Bilan, Aujourd'hui sur l'Accueil).
    // À ne PAS confondre avec bgElevated qui reste sombre pour les écrans
    // dark "purs" (Stats Center, sheets, etc.).
    bgCardLight: '#FAFAF7',
    bgCardLightInner: '#F5F4ED',
    textOnLight: '#0A0A0A',
    textOnLightMuted: '#525252',
    textOnLightDim: '#737373',
    borderOnLightFaint: 'rgba(10, 10, 10, 0.06)',
    borderOnLightSoft: 'rgba(10, 10, 10, 0.10)',
    goldOnLight: '#B8941F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
