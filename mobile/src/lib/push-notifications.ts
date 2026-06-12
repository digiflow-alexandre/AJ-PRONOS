import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

/**
 * Configure le handler de notifs au foreground (= comment l'app affiche
 * une notif quand elle est ouverte). À appeler une fois au démarrage.
 */
export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Demande la permission iOS d'envoyer des notifs, récupère le token push
 * Expo, et le stocke dans le profile Supabase.
 *
 * @returns L'Expo push token (ExponentPushToken[...]) si OK, null si refus
 */
export async function registerForPushNotifications(
  userId: string,
): Promise<{ token: string | null; error: string | null }> {
  // Les notifs ne marchent que sur appareil physique (pas simulator)
  if (!Device.isDevice) {
    return {
      token: null,
      error: 'Les notifications nécessitent un appareil physique (pas un simulateur).',
    };
  }

  // 1) Permission iOS
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return { token: null, error: 'Permission refusée par l’utilisateur.' };
  }

  // 2) Canal Android (no-op sur iOS)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#B8941F',
    });
  }

  // 3) Récupère le token Expo push
  // ProjectId requis depuis SDK 49+ — vient de app.json expo.extra.eas.projectId
  // ou de expo.slug + expo.owner via Constants
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  let pushToken: Notifications.ExpoPushToken;
  try {
    pushToken = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue';
    return {
      token: null,
      error: `Récupération du token échouée : ${msg}. Lance 'npx eas init' pour créer un projectId.`,
    };
  }

  // 4) Stocker dans profiles
  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ expo_push_token: pushToken.data })
    .eq('id', userId);
  if (dbErr) {
    return { token: pushToken.data, error: `Stockage échoué : ${dbErr.message}` };
  }

  return { token: pushToken.data, error: null };
}

/**
 * Retire le push token du profile (à appeler à la déconnexion ou quand
 * l'user désactive complètement les notifs).
 */
export async function unregisterPushToken(userId: string) {
  await supabase
    .from('profiles')
    .update({ expo_push_token: null })
    .eq('id', userId);
}
