/**
 * RevenueCat — initialisation et helpers.
 *
 * Architecture :
 * - Le SDK est initialisé une fois au démarrage de l'app (RootLayout).
 * - On lie le user RevenueCat au user Supabase via `logIn(supabaseUserId)` dès
 *   qu'une session existe → comme ça nos webhooks reçoivent le bon `app_user_id`
 *   et savent quel `profiles.id` mettre à jour.
 * - L'email du user est exposé via `setAttributes({ $email })` pour que les
 *   webhooks puissent l'inclure dans les emails transactionnels.
 *
 * Note : tant qu'Apple Developer n'est pas validé, on tourne sur la clé Test
 * Store de RevenueCat (= sandbox). On remplacera par les vraies clés iOS et
 * Android quand on aura configuré les apps réelles.
 */

import Purchases, {
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { NativeModules, Platform } from 'react-native';

// Clés API publiques RevenueCat. Idéalement injectées via EAS secrets ou
// expo-constants.extra. Pour l'instant on les laisse en placeholder à
// remplacer dans `app.config.ts` ou via env.
const REVENUECAT_IOS_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? 'appl_PLACEHOLDER';
const REVENUECAT_ANDROID_KEY =
  process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? 'goog_PLACEHOLDER';

// Le module natif RNPurchases n'est pas dispo dans Expo Go (ou dans un dev
// build qui n'a pas re-compilé les pods après l'ajout de react-native-purchases).
// On désactive proprement RevenueCat dans ces environnements pour ne pas crasher.
// → Pour tester les achats : EAS dev build (ou prebuild + run:ios) avec le package linké.
const isNativeAvailable = NativeModules.RNPurchases != null;

let initialized = false;

/** Init au démarrage de l'app. À appeler une seule fois. */
export function initRevenueCat() {
  if (initialized) return;
  initialized = true;

  if (!isNativeAvailable) {
    console.warn('[revenuecat] module natif RNPurchases absent — désactivé. Utilise un EAS dev build pour tester les achats.');
    return;
  }

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey });
}

/**
 * Lie le user RevenueCat à son user Supabase.
 * À appeler dès qu'on a une session active.
 */
export async function linkRevenueCatUser(
  supabaseUserId: string,
  email?: string,
): Promise<CustomerInfo | null> {
  if (!isNativeAvailable) return null;
  try {
    const result = await Purchases.logIn(supabaseUserId);
    if (email) {
      await Purchases.setAttributes({ $email: email });
    }
    return result.customerInfo;
  } catch (err) {
    console.warn('[revenuecat] logIn failed', err);
    return null;
  }
}

/** Déconnecte le user RevenueCat (à appeler lors du signOut Supabase). */
export async function unlinkRevenueCatUser(): Promise<void> {
  if (!isNativeAvailable) return;
  try {
    await Purchases.logOut();
  } catch (err) {
    console.warn('[revenuecat] logOut failed', err);
  }
}

/** Récupère les offerings disponibles (= packs proposés à l'achat). */
export async function fetchOfferings(): Promise<PurchasesOffering | null> {
  if (!isNativeAvailable) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current ?? null;
  } catch (err) {
    console.warn('[revenuecat] fetchOfferings failed', err);
    return null;
  }
}

/**
 * Achète un package donné.
 * Retourne :
 *  - { ok: true, customerInfo } si succès
 *  - { ok: false, userCancelled: true } si user a annulé (PAS une erreur)
 *  - { ok: false, error } sinon
 */
export type PurchaseResult =
  | { ok: true; customerInfo: CustomerInfo }
  | { ok: false; userCancelled: true }
  | { ok: false; userCancelled: false; error: string };

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<PurchaseResult> {
  if (!isNativeAvailable) {
    return {
      ok: false,
      userCancelled: false,
      error: 'RevenueCat indisponible (utilise un EAS dev build pour tester).',
    };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo };
  } catch (err: any) {
    // L'utilisateur a annulé le paywall natif → cas normal, on ne traite pas
    // comme une erreur visible.
    if (err?.userCancelled) {
      return { ok: false, userCancelled: true };
    }
    if (err?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { ok: false, userCancelled: true };
    }
    const message =
      err?.message ?? err?.userInfo?.readable_error_message ?? 'Achat impossible';
    return { ok: false, userCancelled: false, error: message };
  }
}

/** Restaure les achats (obligatoire Apple Guideline 3.1.1). */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isNativeAvailable) return null;
  try {
    return await Purchases.restorePurchases();
  } catch (err) {
    console.warn('[revenuecat] restore failed', err);
    return null;
  }
}

/** Récupère les infos abo en cours du user connecté. */
export async function getCurrentSubscription(): Promise<CustomerInfo | null> {
  if (!isNativeAvailable) return null;
  try {
    return await Purchases.getCustomerInfo();
  } catch (err) {
    console.warn('[revenuecat] getCustomerInfo failed', err);
    return null;
  }
}

/** Tier actif déduit des entitlements actifs côté RevenueCat. */
export function tierFromCustomerInfo(
  info: CustomerInfo | null,
): 'starter' | 'pro' | 'vip' | null {
  if (!info) return null;
  const active = info.entitlements.active;
  if (active['vip']) return 'vip';
  if (active['pro']) return 'pro';
  if (active['starter']) return 'starter';
  return null;
}
