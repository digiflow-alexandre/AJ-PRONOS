import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/custom-tab-bar';
import { useNotificationTapHandler } from '@/lib/use-notification-tap-handler';
import { useProfile } from '@/lib/use-profile';

export default function AppTabsLayout() {
  const { isStaff, profile, isTrialActive } = useProfile();
  // Route automatiquement quand l'utilisateur tap sur une notif push
  useNotificationTapHandler();
  const isVip = profile?.tier === 'vip' && (isTrialActive || !profile.trial_ends_at);
  // Le salon est accessible aux VIP et aux staff (Alex + Julien)
  const canSeeVipSalon = isVip || isStaff;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="pronos" options={{ title: 'Pronos' }} />

      {/* Abonnement — masqué pour les staff (admin/validator), ils n'en
          ont pas besoin et ça allège leur barre de navigation. */}
      <Tabs.Screen
        name="subscribe"
        options={{
          title: 'Abonnement',
          tabBarItemStyle: { display: isStaff ? 'none' : 'flex' },
        }}
      />

      {/* Tab Salon VIP — visible si tier=vip OU staff */}
      <Tabs.Screen
        name="vip"
        options={{
          title: 'Salon VIP',
          tabBarItemStyle: { display: canSeeVipSalon ? 'flex' : 'none' },
        }}
      />

      {/* Tab Admin — visible uniquement pour role = admin OU validator */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarItemStyle: { display: isStaff ? 'flex' : 'none' },
        }}
      />
    </Tabs>
  );
}
