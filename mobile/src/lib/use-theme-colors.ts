import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Normalise le ColorSchemeName ('light' | 'dark' | null | 'unspecified')
 * en 'light' | 'dark' et retourne la palette correspondante.
 */
export function useThemeColors() {
  const scheme = useColorScheme();
  const key = scheme === 'dark' ? 'dark' : 'light';
  return Colors[key];
}
