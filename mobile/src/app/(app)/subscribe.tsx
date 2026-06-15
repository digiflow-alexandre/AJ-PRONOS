import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

import { BrandHeader } from '@/components/brand-header';
import { PricingCard } from '@/components/pricing-card';
import { PACKS, type Pack } from '@/constants/packs';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';
import {
  fetchOfferings,
  purchasePackage,
  restorePurchases,
} from '@/lib/revenuecat';
import { useThemeColors } from '@/lib/use-theme-colors';

export default function SubscribeScreen() {
  const c = useThemeColors();
  const { isTrialActive, trialDaysLeft, profile, refresh } = useProfile();
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loadingOffering, setLoadingOffering] = useState(true);
  const [purchasingTier, setPurchasingTier] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    (async () => {
      const off = await fetchOfferings();
      setOffering(off);
      setLoadingOffering(false);
    })();
  }, []);

  function findPackage(tier: 'starter' | 'pro' | 'vip'): PurchasesPackage | null {
    if (!offering) return null;
    // On a configuré 3 packages custom dans RC : starter, pro, vip
    return (
      offering.availablePackages.find((p) => p.identifier === tier) ?? null
    );
  }

  async function onBuy(tier: 'starter' | 'pro' | 'vip') {
    const pkg = findPackage(tier);
    if (!pkg) {
      Alert.alert(
        'Indisponible',
        'Ce pack n’est pas encore disponible à l’achat. Réessaie dans un instant.',
      );
      return;
    }
    setPurchasingTier(tier);
    const res = await purchasePackage(pkg);
    setPurchasingTier(null);

    if (res.ok) {
      // Le webhook RC va sync le profil côté Supabase. On rafraîchit.
      await refresh?.();
      Alert.alert(
        'Bienvenue 🎉',
        `Ton abonnement ${tier.toUpperCase()} est actif. Merci de la confiance !`,
      );
      return;
    }
    if (res.userCancelled) return; // silencieux
    Alert.alert('Achat impossible', res.error);
  }

  async function onRestore() {
    setRestoring(true);
    const info = await restorePurchases();
    setRestoring(false);
    if (info && Object.keys(info.entitlements.active).length > 0) {
      await refresh?.();
      Alert.alert('Achats restaurés', 'Ton abonnement a été rétabli.');
    } else {
      Alert.alert(
        'Aucun achat à restaurer',
        'Nous n’avons pas trouvé d’abonnement actif sur ce compte Apple/Google.',
      );
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BrandHeader />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        <SubscribeHeader
          tier={profile?.tier ?? null}
          isTrialActive={isTrialActive}
          trialDaysLeft={trialDaysLeft}
        />

        {loadingOffering ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator color={c.gold} />
          </View>
        ) : null}

        <View style={styles.cards}>
          {PACKS.map((pack) => (
            <PricingCard
              key={pack.tier}
              pack={pack}
              isCurrent={profile?.tier === pack.tier}
              loading={purchasingTier === pack.tier}
              onPress={() => onBuy(pack.tier)}
            />
          ))}
        </View>

        {/* Bouton "Restaurer mes achats" — obligatoire Apple Guideline 3.1.1 */}
        <Pressable
          onPress={onRestore}
          disabled={restoring}
          style={({ pressed }) => [
            styles.restoreBtn,
            { borderColor: c.borderSoft, opacity: pressed || restoring ? 0.6 : 1 },
          ]}>
          {restoring ? (
            <ActivityIndicator color={c.text} size="small" />
          ) : (
            <SymbolView
              name="arrow.clockwise"
              size={14}
              tintColor={c.text}
              weight="medium"
            />
          )}
          <Text style={[styles.restoreText, { color: c.text }]}>
            Restaurer mes achats
          </Text>
        </Pressable>

        <Text style={[styles.legal, { color: c.textDim }]}>
          Sans engagement, résiliable en un clic. Renouvellement automatique
          jusqu’à résiliation. +18 — les paris sportifs comportent des risques.
        </Text>
      </ScrollView>
    </View>
  );
}

function SubscribeHeader({
  tier,
  isTrialActive,
  trialDaysLeft,
}: {
  tier: Pack['tier'] | 'trial' | null;
  isTrialActive: boolean;
  trialDaysLeft: number;
}) {
  const c = useThemeColors();

  const statusLabel = isTrialActive
    ? `Essai · J-${trialDaysLeft}`
    : tier && tier !== 'trial'
      ? `Abonné ${tier.toUpperCase()}`
      : null;

  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerTitleRow}>
        <Text style={[styles.title, { color: c.text }]}>
          Choisis ta carte.
        </Text>
        {statusLabel ? (
          <View
            style={[
              styles.statusChip,
              { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
            ]}>
            <View style={[styles.statusDot, { backgroundColor: c.gold }]} />
            <Text style={[styles.statusText, { color: c.text }]}>
              {statusLabel}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.benefitsRow}>
        <BenefitTile icon="clock" label="7 jours" sublabel="sur Starter" />
        <BenefitTile icon="checkmark.seal" label="Sans" sublabel="engagement" />
        <BenefitTile icon="hand.tap" label="Résiliable" sublabel="en 1 clic" />
      </View>
    </View>
  );
}

function BenefitTile({
  icon,
  label,
  sublabel,
}: {
  icon: string;
  label: string;
  sublabel: string;
}) {
  const c = useThemeColors();
  return (
    <View
      style={[
        styles.benefitTile,
        { backgroundColor: c.bgElevated, borderColor: c.borderFaint },
      ]}>
      <SymbolView
        name={icon as never}
        size={18}
        tintColor={c.gold}
        weight="medium"
      />
      <View style={styles.benefitTextWrap}>
        <Text style={[styles.benefitLabel, { color: c.text }]}>{label}</Text>
        <Text style={[styles.benefitSublabel, { color: c.textMuted }]}>
          {sublabel}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  container: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
    gap: Spacing.four,
  },
  headerBlock: { gap: Spacing.three },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.6,
    flexShrink: 1,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  benefitsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  benefitTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  benefitTextWrap: {
    flexShrink: 1,
  },
  benefitLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  benefitSublabel: {
    fontSize: 10,
    lineHeight: 13,
  },
  cards: {
    gap: Spacing.five,
    marginTop: Spacing.two,
  },
  loadingBlock: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  restoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: 'center',
    marginTop: Spacing.three,
  },
  restoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  legal: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.three,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.lg,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
