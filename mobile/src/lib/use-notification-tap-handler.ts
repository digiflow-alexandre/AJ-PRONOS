import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

/**
 * Hook qui écoute les taps sur notifications push et route vers l'écran
 * approprié selon le `data.type` envoyé par les Edge Functions.
 *
 * À monter au niveau du layout principal de l'app (post-auth).
 *
 * Types reconnus :
 *  - 'prono_result' → ouvre la fiche du prono
 *  - 'admin_pending_reminder' → ouvre l'admin
 *  - 'admin_unparsed_predictions' → ouvre l'admin
 *  - 'new_message' (salon VIP) → ouvre le salon VIP
 */
export function useNotificationTapHandler() {
  const router = useRouter();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | { type?: string; bet_id?: string; url?: string }
          | undefined;
        if (!data?.type) return;

        switch (data.type) {
          case 'prono_result':
            if (data.bet_id) {
              router.push({
                pathname: '/bet/[id]',
                params: { id: data.bet_id },
              });
            }
            break;
          case 'admin_pending_reminder':
          case 'admin_unparsed_predictions':
            router.push('/(app)/admin');
            break;
          case 'new_vip_message':
            router.push('/(app)/vip');
            break;
          default:
            // Type inconnu : fallback url si fourni
            if (data.url) {
              router.push(data.url as never);
            }
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, [router]);
}
