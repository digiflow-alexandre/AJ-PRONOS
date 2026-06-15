import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BetCarousel } from '@/components/bet-carousel';
import { BrandedButton } from '@/components/branded-button';
import { HomeBetCard } from '@/components/home-bet-card';
import { DailyRecapModal } from '@/components/daily-recap-modal';
import { HomeHero, HomeStickyTopBar } from '@/components/home-hero';
import { OnboardingScreen } from '@/components/onboarding-screen';
import { StatsBilanRow } from '@/components/stats-bilan-row';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { computeBilan, getGreeting } from '@/lib/bilan';
import { computeRecap, type RecapData } from '@/lib/recap';
import { useAllBets } from '@/lib/use-all-bets';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useUserBets } from '@/lib/use-user-bets';
import { useThemeColors } from '@/lib/use-theme-colors';
import { getBetActiveDates, getBetStartDate, localDayKey } from '@/types/prono';
import type { AnyBet, ComboBet, Prono } from '@/types/prono';

// Clé AsyncStorage pour ne montrer la modal "essai terminé" qu'une seule fois
// par expiration. On stocke la date d'expiration vue → si elle change (nouveau
// trial démarré + ré-expiré), on remontre la modal.
const TRIAL_EXPIRED_SEEN_KEY = '@aj/trial-expired-seen-at';

// Clé AsyncStorage pour le bilan résultats : timestamp ISO de la dernière fois
// où on a montré (ou explicitement skippé) la modal de bilan. À la prochaine
// ouverture, on filtre les paris résolus dont la date de match > cette valeur.
const RECAP_LAST_SHOWN_KEY = '@aj/recap-last-shown-at';

export default function HomeScreen() {
  const c = useThemeColors();
  const { session } = useAuth();
  const {
    profile,
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
    canAccess,
    startTrial,
    isOnboarded,
    isLoading,
  } = useProfile();
  const { personalRoi } = useUserBets();
  const { bets: allBets } = useAllBets();
  const router = useRouter();

  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);
  const [expiredModalOpen, setExpiredModalOpen] = useState(false);

  // Bilan résultats : modal ouverte si paris résolus depuis dernière visite
  const [recapModalOpen, setRecapModalOpen] = useState(false);
  const [recapData, setRecapData] = useState<RecapData | null>(null);

  // Greeting recalculé chaque minute (passage matin → midi → soir).
  // Pattern "tick périodique" → setState légitime dans l'effet.
  const [greeting, setGreeting] = useState('Bonjour');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting());
    const id = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Bilan résultats : au premier mount du dashboard (après onboarding ok),
  // on regarde la dernière fois qu'on a montré la modal. Si nouveaux paris
  // résolus depuis → on prépare les données et on ouvre.
  // À la première ouverture (pas de clé) : on initialise juste la date,
  // sans afficher la modal (pas de "récap historique" gros bloc au 1er login).
  useEffect(() => {
    if (!isOnboarded) return;
    let cancelled = false;
    (async () => {
      const stored = await AsyncStorage.getItem(RECAP_LAST_SHOWN_KEY);
      if (cancelled) return;
      const nowISO = new Date().toISOString();
      if (!stored) {
        await AsyncStorage.setItem(RECAP_LAST_SHOWN_KEY, nowISO);
        return;
      }
      const data = computeRecap(allBets, stored, nowISO);
      if (data.total > 0) {
        setRecapData(data);
        setRecapModalOpen(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // On NE veut PAS re-déclencher la popup à chaque update d'allBets
    // (re-fetch Realtime), seulement au mount post-onboarding. allBets
    // est lu de manière non-réactive ici.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboarded]);

  async function closeRecapModal() {
    setRecapModalOpen(false);
    // Marquer la date courante pour ne pas re-montrer les mêmes paris.
    await AsyncStorage.setItem(RECAP_LAST_SHOWN_KEY, new Date().toISOString());
  }

  // Affiche la modal "essai terminé" 1x quand l'utilisateur arrive sur
  // l'Accueil après que son trial vient d'expirer. On stocke la date
  // d'expiration vue dans AsyncStorage → si elle change, on ré-affiche.
  useEffect(() => {
    if (!isTrialExpired || !profile?.trial_ends_at) return;
    const key = profile.trial_ends_at;
    let cancelled = false;
    (async () => {
      const seen = await AsyncStorage.getItem(TRIAL_EXPIRED_SEEN_KEY);
      if (cancelled) return;
      if (seen !== key) {
        setExpiredModalOpen(true);
        await AsyncStorage.setItem(TRIAL_EXPIRED_SEEN_KEY, key);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isTrialExpired, profile?.trial_ends_at]);

  const shouldShowTrialBanner = !isLoading && profile && profile.tier === null;
  const shouldShowExpiredBanner = !isLoading && isTrialExpired;

  // Bilan AJ Pronos sur 7 derniers jours — uniquement les paris simples
  // (les combinés ont leur propre logique de comptage, sera intégré quand
  // on aura plus de fixtures combinés récents).
  const bilan = useMemo(
    () => computeBilan(allBets, 7),
    [allBets],
  );

  // Pronos du jour (limités aux 3 premiers, triés par heure).
  // Un combo apparaît dès qu'au moins une de ses sélections tombe
  // aujourd'hui (option A — Alex 2026-06-05).
  const todayBets = useMemo(() => {
    const todayKey = localDayKey(new Date());
    return allBets
      .filter((b) => getBetActiveDates(b).includes(todayKey))
      .sort(
        (a, b) =>
          new Date(getBetStartDate(a)).getTime() -
          new Date(getBetStartDate(b)).getTime(),
      )
      .slice(0, 3);
  }, [allBets]);

  function hasAccess(bet: AnyBet): boolean {
    return canAccess(bet.minTier);
  }

  function openBetDetail(bet: AnyBet) {
    // /bet/[id] = route racine (hors tab Pronos) pour ne pas empiler la
    // fiche dans la sous-stack du tab. Quand l'utilisateur ferme la
    // fiche, on retombe sur l'Accueil et l'onglet Pronos reste sur sa
    // liste (au lieu d'être bloqué sur la fiche).
    router.push({
      pathname: '/bet/[id]',
      params: { id: bet.id },
    });
  }

  async function onStartTrial() {
    setTrialError(null);
    setStarting(true);
    const { error } = await startTrial();
    setStarting(false);
    if (error) {
      setTrialError(error);
      return;
    }
    setTrialModalOpen(false);
  }

  // Priorité au pseudo défini à l'onboarding ; fallback sur prénom email
  // si pseudo manque (cas légacy pré-migration 004).
  const userDisplay = (() => {
    if (profile?.display_name) return profile.display_name;
    const userFirstName =
      session?.user.email?.split('@')[0]?.split('.')[0] ?? '';
    return userFirstName.charAt(0).toUpperCase() + userFirstName.slice(1);
  })();

  // Pendant le chargement initial du profile, on ne rend rien
  // (évite un flash de l'écran Accueil avant de basculer en onboarding).
  if (isLoading) {
    return <View style={[styles.screen, { backgroundColor: c.bg }]} />;
  }

  // Si l'utilisateur n'a pas terminé son onboarding, on l'affiche en plein
  // écran à la place du dashboard. Pas de BrandHeader ni de tabs visibles —
  // les NativeTabs sont gérés par le _layout et restent affichées en bas,
  // mais l'onboarding scrolle indépendamment.
  if (!isOnboarded) {
    return <OnboardingScreen />;
  }

  // Chip trial (Essai · J-N, Essai terminé, ou null) — passé en prop au Hero
  // pour qu'il s'affiche par-dessus l'image stade.
  const trialChip = isTrialActive ? (
    <View
      style={[
        styles.trialChip,
        {
          backgroundColor: 'rgba(0,0,0,0.35)',
          borderColor: c.gold,
        },
      ]}>
      <View style={[styles.trialChipDot, { backgroundColor: c.gold }]} />
      <Text style={[styles.trialChipText, { color: c.text }]}>
        Essai · J-{trialDaysLeft}
      </Text>
    </View>
  ) : isTrialExpired ? (
    <View
      style={[
        styles.trialChip,
        {
          backgroundColor: 'rgba(239, 68, 68, 0.20)',
          borderColor: '#EF4444',
        },
      ]}>
      <View style={[styles.trialChipDot, { backgroundColor: '#EF4444' }]} />
      <Text style={[styles.trialChipText, { color: c.text }]}>
        Essai terminé
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Image stade en background absolu sur tout l'écran */}
      <ExpoImage
        source={require('@/assets/images/hero-stadium.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      {/* Overlay sombre pour lisibilité du contenu par-dessus l'image */}
      <View style={styles.bgOverlay} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}>
        {/* Spacer pour décaler le contenu sous la sticky top bar */}
        <View style={styles.stickyBarSpacer} />

        {/* Hero header : salutation + badge trial, par-dessus l'image */}
        <HomeHero
          greeting={greeting}
          userDisplay={userDisplay || 'Joueur'}
          trialChip={trialChip}
        />

        <View style={styles.body}>
        {/* Bannière trial gratuit (si pas encore démarré) */}
        {shouldShowTrialBanner ? (
          <Pressable
            onPress={() => setTrialModalOpen(true)}
            style={[
              styles.trialBanner,
              { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
            ]}>
            <Text style={[styles.bannerEyebrow, { color: c.gold }]}>
              — 7 JOURS OFFERTS
            </Text>
            <Text style={[styles.bannerTitle, { color: c.text }]}>
              Découvre le pack Starter.
            </Text>
            <Text style={[styles.bannerBody, { color: c.textMuted }]}>
              Accès aux pronos du pack Starter pendant 7 jours. Sans
              engagement, aucune carte demandée.
            </Text>
            <Text style={[styles.bannerCta, { color: c.gold }]}>
              Démarrer →
            </Text>
          </Pressable>
        ) : null}

        {/* Bannière trial terminé (persistante tant que pas abonné) */}
        {shouldShowExpiredBanner ? (
          <Pressable
            onPress={() => router.push('/(app)/subscribe')}
            style={[
              styles.trialBanner,
              {
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderColor: '#EF4444',
              },
            ]}>
            <Text
              style={[styles.bannerEyebrow, { color: '#EF4444' }]}>
              — ESSAI TERMINÉ
            </Text>
            <Text style={[styles.bannerTitle, { color: c.text }]}>
              Choisis ton pack pour continuer.
            </Text>
            <Text style={[styles.bannerBody, { color: c.textMuted }]}>
              Tes 7 jours d’essai Starter sont terminés. L’accès aux pronos
              est désormais réservé aux abonnés.
            </Text>
            <Text style={[styles.bannerCta, { color: '#EF4444' }]}>
              Voir les packs →
            </Text>
          </Pressable>
        ) : null}

        {/* Card AUJOURD'HUI : effet glass (BlurView) quand y'a des paris
            pour laisser deviner les bg images des cards en dessous ;
            fond crème pour l'empty state (besoin du contraste).
            Contour conservé dans les 2 cas. */}
        <View
          style={[
            styles.cardLight,
            todayBets.length === 0
              ? { backgroundColor: c.bgCardLight, borderColor: c.borderOnLightFaint }
              : {
                  backgroundColor: 'rgba(20,20,22,0.35)',
                  borderColor: 'rgba(250,250,247,0.18)',
                  overflow: 'hidden',
                },
          ]}>
          {todayBets.length > 0 ? (
            <BlurView
              intensity={28}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
            />
          ) : null}
          <View style={styles.cardLightHead}>
            <View style={styles.cardLightHeadLeft}>
              <SymbolView
                name="bolt.fill"
                size={14}
                tintColor={todayBets.length === 0 ? c.goldOnLight : c.gold}
                weight="semibold"
              />
              <Text
                style={[
                  styles.cardEyebrowDark,
                  { color: todayBets.length === 0 ? c.textOnLight : c.text },
                ]}>
                AUJOURD’HUI
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/(app)/pronos')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.seeAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text
                style={[
                  styles.seeAllText,
                  { color: todayBets.length === 0 ? c.textOnLight : c.text },
                ]}>
                Voir tout
              </Text>
              <SymbolView
                name="arrow.right"
                size={12}
                tintColor={todayBets.length === 0 ? c.textOnLight : c.text}
                weight="semibold"
              />
            </Pressable>
          </View>

          {todayBets.length === 0 ? (
            <View
              style={[
                styles.todayEmpty,
                { backgroundColor: c.bgCardLightInner },
              ]}>
              <View
                style={[
                  styles.todayEmptyIcon,
                  { backgroundColor: c.goldOnLight },
                ]}>
                <SymbolView
                  name="megaphone.fill"
                  size={20}
                  tintColor="#0A0A0A"
                  weight="semibold"
                />
              </View>
              <View style={styles.todayEmptyText}>
                <Text style={[styles.todayEmptyTitle, { color: c.textOnLight }]}>
                  Pas de prono publié aujourd’hui.
                </Text>
                <Text
                  style={[styles.todayEmptyBody, { color: c.textOnLightMuted }]}>
                  Notre analyste valide les pronos en début de matinée —
                  reviens plus tard.
                </Text>
              </View>
            </View>
          ) : (
            <BetCarousel>
              {todayBets.map((b) => (
                <HomeBetCard
                  key={b.id}
                  bet={b}
                  hasAccess={hasAccess(b)}
                  onPress={() => openBetDetail(b)}
                />
              ))}
            </BetCarousel>
          )}
        </View>

        {/* Card dark border doré : TON BILAN (carnet user) */}
        <View
          style={[
            styles.cardDark,
            { backgroundColor: c.bgElevated, borderColor: c.borderFaint },
          ]}>
          <View style={styles.cardLightHead}>
            <View style={styles.cardLightHeadLeft}>
              <SymbolView
                name="chart.bar.fill"
                size={14}
                tintColor={c.gold}
                weight="semibold"
              />
              <Text style={[styles.cardEyebrowLight, { color: c.text }]}>
                TON BILAN
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/carnet')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.seeAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.seeAllText, { color: c.text }]}>
                Carnet
              </Text>
              <SymbolView
                name="arrow.right"
                size={12}
                tintColor={c.text}
                weight="semibold"
              />
            </Pressable>
          </View>
          <View
            style={[
              styles.cardDarkInner,
              { backgroundColor: c.bgDeeper, borderColor: c.gold },
            ]}>
            {personalRoi.totalPlayed === 0 ? (
              <View style={styles.personalEmptyInner}>
                <Text style={[styles.personalEmptyTitle, { color: c.text }]}>
                  Ton carnet est vide.
                </Text>
                <Text style={[styles.personalEmptyBody, { color: c.textMuted }]}>
                  Quand tu joues un de nos pronos, marque-le « J’ai joué »
                  sur la fiche pour suivre ton ROI réel.
                </Text>
              </View>
            ) : (
              <PersonalRoiCard roi={personalRoi} />
            )}
          </View>
        </View>

        {/* Card crème : NOTRE BILAN 7 JOURS (preuve sociale, en dernier) */}
        <View
          style={[
            styles.cardLight,
            { backgroundColor: c.bgCardLight, borderColor: c.borderOnLightFaint },
          ]}>
          <View style={styles.cardLightHead}>
            <View style={styles.cardLightHeadLeft}>
              <SymbolView
                name="target"
                size={14}
                tintColor={c.goldOnLight}
                weight="semibold"
              />
              <Text style={[styles.cardEyebrowDark, { color: c.textOnLight }]}>
                NOTRE BILAN · 7 JOURS
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/stats')}
              hitSlop={6}
              style={({ pressed }) => [
                styles.seeAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Text style={[styles.seeAllText, { color: c.textOnLight }]}>
                Tout voir
              </Text>
              <SymbolView
                name="arrow.right"
                size={12}
                tintColor={c.textOnLight}
                weight="semibold"
              />
            </Pressable>
          </View>
          <View
            style={[
              styles.cardLightInner,
              {
                backgroundColor: c.bgCardLightInner,
                borderColor: c.goldOnLight,
              },
            ]}>
            <StatsBilanRow bilan={bilan} />
          </View>
          <Text style={[styles.bilanFootnoteOnLight, { color: c.textOnLightDim }]}>
            Sur les 7 derniers jours. Performance passée,{'\n'}
            ne préjuge pas du futur.
          </Text>
        </View>

        {/* Bannière +18 pill noire */}
        <View
          style={[
            styles.legalPill,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}>
          <View style={[styles.legalPillBadge, { backgroundColor: c.gold }]}>
            <Text style={styles.legalPillBadgeText}>+18</Text>
          </View>
          <Text style={[styles.legalPillText, { color: c.text }]}>
            +18 — les paris sportifs comportent des risques.
          </Text>
        </View>

        </View>
      </ScrollView>

      {/* Sticky top bar : logo + cloche + profil — toujours visible au scroll */}
      <View style={styles.stickyBarWrap} pointerEvents="box-none">
        <HomeStickyTopBar />
      </View>

      {/* Modal essai gratuit */}
      <Modal
        visible={trialModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTrialModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setTrialModalOpen(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalEyebrow, { color: c.gold }]}>
              — ESSAI STARTER
            </Text>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              7 jours, sans CB.
            </Text>
            <Text style={[styles.modalBody, { color: c.textMuted }]}>
              Accès gratuit au pack{' '}
              <Text style={{ color: c.text, fontWeight: '700' }}>Starter</Text>{' '}
              pendant 7 jours. À la fin de l’essai, tu choisis ton pack ou tu
              perds l’accès — aucune surprise, aucun débit automatique. Les
              packs Pro et VIP restent disponibles à l’abonnement direct.
            </Text>

            {trialError ? (
              <Text style={[styles.error, { color: c.danger }]}>
                {trialError}
              </Text>
            ) : null}

            <View style={{ gap: Spacing.two }}>
              <BrandedButton
                label="Démarrer mes 7 jours"
                loadingLabel="Activation…"
                loading={starting}
                onPress={onStartTrial}
              />
              <BrandedButton
                label="Voir d’abord les packs"
                variant="ghost"
                onPress={() => {
                  setTrialModalOpen(false);
                  router.push('/(app)/subscribe');
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal bilan résultats (auto-show si paris résolus depuis dernière visite) */}
      {recapData ? (
        <DailyRecapModal
          visible={recapModalOpen}
          data={recapData}
          onClose={closeRecapModal}
        />
      ) : null}

      {/* Modal essai terminé (auto-show 1x après expiration) */}
      <Modal
        visible={expiredModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setExpiredModalOpen(false)}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setExpiredModalOpen(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.modalEyebrow, { color: '#EF4444' }]}>
              — ESSAI TERMINÉ
            </Text>
            <Text style={[styles.modalTitle, { color: c.text }]}>
              7 jours, c’est passé vite.
            </Text>
            <Text style={[styles.modalBody, { color: c.textMuted }]}>
              Ton essai du pack Starter est terminé. Choisis un pack pour
              continuer à recevoir nos pronos, ou ferme cette fenêtre pour
              décider plus tard.
            </Text>
            <View style={{ gap: Spacing.two }}>
              <BrandedButton
                label="Voir les packs"
                onPress={() => {
                  setExpiredModalOpen(false);
                  router.push('/(app)/subscribe');
                }}
              />
              <BrandedButton
                label="Plus tard"
                variant="ghost"
                onPress={() => setExpiredModalOpen(false)}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function PersonalRoiCard({
  roi,
}: {
  roi: ReturnType<typeof useUserBets>['personalRoi'];
}) {
  const c = useThemeColors();
  const hasStakes = roi.totalStaked > 0;
  const roiColor =
    roi.realRoi > 0 ? c.success : roi.realRoi < 0 ? c.danger : c.text;
  const netColor =
    roi.netGain > 0 ? c.success : roi.netGain < 0 ? c.danger : c.text;
  return (
    <View
      style={[
        styles.roiCard,
        { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
      ]}>
      <View style={styles.roiRow}>
        <View style={styles.roiMetric}>
          <Text
            style={[styles.roiValue, { color: c.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {roi.winRate}%
          </Text>
          <Text style={[styles.roiLabel, { color: c.textMuted }]}>
            réussite
          </Text>
          <Text style={[styles.roiSub, { color: c.textDim }]}>
            {roi.wins}V · {roi.losses}D
            {roi.voids > 0 ? ` · ${roi.voids}A` : ''}
          </Text>
        </View>
        <View style={styles.roiDivider} />
        <View style={styles.roiMetric}>
          {hasStakes ? (
            <>
              <Text
                style={[styles.roiValue, { color: netColor }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}>
                {roi.netGain >= 0 ? '+' : ''}
                {roi.netGain.toFixed(2)}€
              </Text>
              <Text style={[styles.roiLabel, { color: c.textMuted }]}>
                gain net
              </Text>
              <Text style={[styles.roiSub, { color: roiColor }]}>
                ROI{' '}
                {roi.realRoi > 0 ? '+' : ''}
                {roi.realRoi}%
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.roiValue, { color: c.textMuted }]}>—</Text>
              <Text style={[styles.roiLabel, { color: c.textMuted }]}>
                gain net
              </Text>
              <Text style={[styles.roiSub, { color: c.textDim }]}>
                ajoute tes mises
              </Text>
            </>
          )}
        </View>
        <View style={styles.roiDivider} />
        <View style={styles.roiMetric}>
          <Text
            style={[styles.roiValue, { color: c.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}>
            {roi.totalPlayed}
          </Text>
          <Text style={[styles.roiLabel, { color: c.textMuted }]}>joués</Text>
          <Text style={[styles.roiSub, { color: c.textDim }]}>
            {roi.pending > 0 ? `${roi.pending} en attente` : 'tous résolus'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Overlay sombre léger : on veut VOIR le stade en background, juste
    // assez de contraste pour que les cards crème ressortent.
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  stickyBarWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  // Spacer pour décaler le contenu sous la sticky top bar.
  // Calcul : safe area top (~54px iPhone notch) + 4 padTop + 40 logo + 6 padBottom
  // + 20 marge de respiration = ~125px.
  stickyBarSpacer: {
    height: 125,
  },
  container: {
    flexGrow: 1,
    // Tab bar custom flottante (~120px : pill + safe area + marges).
    paddingBottom: BottomTabInset + Spacing.five + 60,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  // === Cards de la maquette ===
  cardLight: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardDark: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  cardLightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardLightHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  cardEyebrowDark: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardEyebrowLight: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardLightInner: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: Spacing.three,
  },
  cardDarkInner: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: Spacing.three,
  },
  bilanFootnoteOnLight: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  personalEmptyInner: {
    gap: 6,
    paddingVertical: 4,
  },
  // === Aujourd'hui empty state ===
  todayEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: 14,
  },
  todayEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayEmptyText: {
    flex: 1,
    gap: 4,
  },
  todayEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  todayEmptyBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  // === Bannière +18 ===
  legalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'center',
  },
  legalPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  legalPillBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  legalPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  trialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  trialChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  trialChipText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  trialBanner: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 6,
  },
  bannerEyebrow: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  bannerBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  bannerCta: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: Spacing.one,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeadRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '600',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  bilanFootnote: {
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  emptyToday: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  personalEmpty: {
    padding: Spacing.four,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: 'dashed',
    gap: 6,
  },
  personalEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  personalEmptyBody: {
    fontSize: 13,
    lineHeight: 19,
  },
  roiCard: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  roiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roiMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  roiValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  roiLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  roiSub: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
  roiDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginHorizontal: 4,
  },
  emptyTodayText: {
    fontSize: 13,
    lineHeight: 19,
  },
  legalNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: Spacing.three,
  },
  modalBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  error: {
    fontSize: 13,
  },
});
