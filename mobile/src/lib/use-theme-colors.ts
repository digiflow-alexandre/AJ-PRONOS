import { Colors } from '@/constants/theme';

/**
 * Retourne la palette de couleurs du thème.
 *
 * V1.1 (2026-06-04) : refonte dark mode forcée sur toute l'app pour matcher
 * la nouvelle DA (hero stade + cards alternant crème/noir + accents or).
 * Le mode light reste défini dans `theme.ts` au cas où on veut le réactiver
 * en V2, mais on ne lit plus `useColorScheme()` pour l'instant.
 */
export function useThemeColors() {
  return Colors.dark;
}
