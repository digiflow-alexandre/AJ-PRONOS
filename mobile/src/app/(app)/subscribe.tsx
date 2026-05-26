import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandedButton } from '@/components/branded-button';
import { BrandHeader } from '@/components/brand-header';
import { PricingCard } from '@/components/pricing-card';
import { PACKS, type Pack } from '@/constants/packs';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';

type Billing = 'monthly' | 'yearly';

export default function SubscribeScreen() {
  const c = useThemeColors();
  const { isTrialActive, trialDaysLeft, profile } = useProfile();
  const [billing, setBilling] = useState<Billing>('monthly');
  const [waitlistOpen, setWaitlistOpen] = useState<Pack | null>(null);

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

        <BillingToggle value={billing} onChange={setBilling} />

        <View style={styles.cards}>
          {PACKS.map((pack) => (
            <PricingCard
              key={pack.tier}
              pack={pack}
              billing={billing}
              isCurrent={profile?.tier === pack.tier}
              onPress={() => setWaitlistOpen(pack)}
            />
          ))}
        </View>

        <Text style={[styles.legal, { color: c.textDim }]}>
          Sans engagement, résiliable en un clic. Renouvellement automatique
          jusqu’à résiliation. +18 — les paris sportifs comportent des risques.
        </Text>
      </ScrollView>

      <WaitlistModal
        pack={waitlistOpen}
        onClose={() => setWaitlistOpen(null)}
      />
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
        <BenefitTile icon="clock" label="7 jours" sublabel="offerts" />
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

function BillingToggle({
  value,
  onChange,
}: {
  value: Billing;
  onChange: (v: Billing) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={[styles.toggle, { backgroundColor: c.bgDeeper }]}>
      <ToggleOption
        label="Mensuel"
        active={value === 'monthly'}
        onPress={() => onChange('monthly')}
      />
      <ToggleOption
        label="Annuel · -20%"
        active={value === 'yearly'}
        onPress={() => onChange('yearly')}
      />
    </View>
  );
}

function ToggleOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.toggleOption,
        active && { backgroundColor: c.bgElevated },
      ]}>
      <Text
        style={[
          styles.toggleLabel,
          { color: active ? c.text : c.textMuted },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function WaitlistModal({
  pack,
  onClose,
}: {
  pack: Pack | null;
  onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <Modal
      visible={!!pack}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable
        style={[styles.modalBackdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.modalEyebrow, { color: c.gold }]}>
            — LISTE D’ATTENTE
          </Text>
          <Text style={[styles.modalTitle, { color: c.text }]}>
            Ouverture imminente.
          </Text>
          <Text style={[styles.modalBody, { color: c.textMuted }]}>
            Le pack{' '}
            <Text style={{ color: c.text, fontWeight: '600' }}>
              {pack?.name}
            </Text>{' '}
            sera dispo à l’abonnement dans quelques jours, le temps qu’on
            finalise les paiements côté App Store. Tu seras prévenu par
            notification dès que c’est ouvert.
          </Text>
          <BrandedButton label="Compris" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
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
  toggle: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.lg,
  },
  toggleOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  cards: {
    gap: Spacing.five,
    marginTop: Spacing.two,
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
