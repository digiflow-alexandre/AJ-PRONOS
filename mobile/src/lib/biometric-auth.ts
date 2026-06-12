/**
 * Authentification biométrique (Face ID / Touch ID).
 *
 * Stocke les credentials chiffrés dans le Keychain iOS via expo-secure-store
 * (chiffrement matériel par défaut, niveau sécurité équivalent aux apps
 * bancaires).
 */

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const KEY_EMAIL = 'aj.bio.email';
const KEY_PASSWORD = 'aj.bio.password';
const KEY_ENABLED = 'aj.bio.enabled';

export type BiometricType = 'face' | 'fingerprint' | 'unknown';

/**
 * Indique si l'appareil supporte la biométrie ET si l'user a enrôlé
 * au moins un visage ou empreinte. Retourne false en simulator.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  return isEnrolled;
}

/**
 * Renvoie le type de biométrie supporté pour adapter le wording UI.
 */
export async function getBiometricType(): Promise<BiometricType> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'face';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'fingerprint';
  }
  return 'unknown';
}

export function biometricLabel(type: BiometricType): string {
  if (type === 'face') return 'Face ID';
  if (type === 'fingerprint') return 'Touch ID';
  return 'Biométrie';
}

/**
 * Active la connexion biométrique : stocke email + password dans le Keychain.
 * À appeler après un login réussi, si l'user accepte le prompt.
 */
export async function enableBiometricLogin(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  try {
    await SecureStore.setItemAsync(KEY_EMAIL, email);
    await SecureStore.setItemAsync(KEY_PASSWORD, password);
    await SecureStore.setItemAsync(KEY_ENABLED, '1');
    return { error: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    return { error: msg };
  }
}

/**
 * Désactive la connexion biométrique : purge les credentials du Keychain.
 */
export async function disableBiometricLogin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_EMAIL);
  await SecureStore.deleteItemAsync(KEY_PASSWORD);
  await SecureStore.deleteItemAsync(KEY_ENABLED);
}

/** Vérifie si la connexion biométrique est activée (credentials stockés). */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await SecureStore.getItemAsync(KEY_ENABLED);
  return enabled === '1';
}

/**
 * Prompt biométrie + retourne les credentials stockés si OK.
 * Retourne null si l'user annule, échoue ou si pas de credentials stockés.
 */
export async function authenticateWithBiometric(
  type: BiometricType,
): Promise<{
  email: string;
  password: string;
} | null> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage:
      type === 'face'
        ? 'Connexion par Face ID'
        : type === 'fingerprint'
          ? 'Connexion par Touch ID'
          : 'Authentification',
    cancelLabel: 'Annuler',
    fallbackLabel: 'Utiliser le code', // bascule au fallback PIN iOS
    disableDeviceFallback: false,
  });

  if (!result.success) return null;

  const email = await SecureStore.getItemAsync(KEY_EMAIL);
  const password = await SecureStore.getItemAsync(KEY_PASSWORD);
  if (!email || !password) return null;

  return { email, password };
}
