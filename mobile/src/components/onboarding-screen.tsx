import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { PricingCard } from '@/components/pricing-card';
import { WaitlistModal } from '@/components/waitlist-modal';
import { PACKS, type Pack } from '@/constants/packs';
import { BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { registerForPushNotifications } from '@/lib/push-notifications';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { RiskLevel, Sport } from '@/types/profile';

const STEPS = [
  'welcome',
  'pseudo',
  'dob',
  'sports',
  'risk',
  'notifs',
  'pack',
] as const;
type Step = (typeof STEPS)[number];

const PSEUDO_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
const MIN_AGE = 18;

function computeAge(dobISO: string, nowMs: number): number {
  const dob = new Date(dobISO);
  if (Number.isNaN(dob.getTime())) return -1;
  let age = new Date(nowMs).getFullYear() - dob.getFullYear();
  const m = new Date(nowMs).getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && new Date(nowMs).getDate() < dob.getDate())) age--;
  return age;
}

type RiskOption = { value: RiskLevel; label: string; baseline: string };
const RISK_OPTIONS: RiskOption[] = [
  {
    value: 'prudent',
    label: 'Prudent',
    baseline: 'Faibles cotes, sécurité avant tout. Les sûrs.',
  },
  {
    value: 'equilibre',
    label: 'Équilibré',
    baseline: 'Mix de cotes raisonnables. La voie centrale.',
  },
  {
    value: 'audacieux',
    label: 'Audacieux',
    baseline: 'Cotes plus élevées, risque assumé. La valeur.',
  },
];

type SportOption = {
  value: Sport;
  label: string;
  icon: string; // SF Symbol
};
const SPORT_OPTIONS: SportOption[] = [
  { value: 'foot', label: 'Football', icon: 'soccerball' },
  { value: 'tennis', label: 'Tennis', icon: 'tennisball' },
];

export function OnboardingScreen() {
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { completeOnboarding, startTrial, checkDisplayNameAvailable } =
    useProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const step: Step = STEPS[stepIndex];

  // State des préférences collectées au fil de l'onboarding
  const [displayName, setDisplayName] = useState('');
  const [pseudoStatus, setPseudoStatus] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle');
  const [dobISO, setDobISO] = useState<string>('');
  const [age, setAge] = useState<number>(-1);
  const [sportsFollowed, setSportsFollowed] = useState<Sport[]>([
    'foot',
    'tennis',
  ]);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('equilibre');
  const [notificationsOptedIn, setNotificationsOptedIn] = useState(false);

  // États de soumission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal liste d'attente (pour Pro/VIP tant que RevenueCat pas branché)
  const [waitlistPack, setWaitlistPack] = useState<Pack | null>(null);

  function canContinue(): boolean {
    if (step === 'pseudo') return pseudoStatus === 'available';
    if (step === 'dob') return age >= MIN_AGE;
    if (step === 'sports') return sportsFollowed.length > 0;
    return true;
  }

  function next() {
    setError(null);
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }

  function prev() {
    setError(null);
    if (stepIndex > 0) setStepIndex(stepIndex - 1);
  }

  function toggleSport(s: Sport) {
    setSportsFollowed((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  /**
   * Démarre l'essai gratuit 7 jours sur le pack Starter (seul CTA actif
   * pendant la phase d'attente RevenueCat). Sauvegarde les prefs +
   * démarre le trial dans la même action atomique. Sortie obligatoire
   * de l'onboarding une fois cette action complétée.
   */
  async function startTrialAndFinish() {
    setSubmitting(true);
    setError(null);
    const { error: prefsErr } = await completeOnboarding({
      displayName: displayName.trim(),
      dateOfBirth: dobISO,
      sportsFollowed,
      riskLevel,
      notificationsOptedIn,
    });
    if (prefsErr) {
      setError(prefsErr);
      setSubmitting(false);
      return;
    }
    const { error: trialErr } = await startTrial();
    setSubmitting(false);
    if (trialErr) {
      setError(trialErr);
      return;
    }
    // À la fin, l'écran (app)/index ne re-rendra plus l'onboarding
    // (isOnboarded passe à true via Realtime).
  }

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + Spacing.three,
          // L'onboarding s'affiche par-dessus le tabs layout → la tab bar
          // custom flottante reste visible en bas. On ajoute son inset +
          // une grosse marge pour que le CTA "Démarrer mon essai" ET le
          // texte "Informations légales" sous le bouton soient visibles.
          // — Alex 2026-06-10.
          paddingBottom: insets.bottom + BottomTabInset + Spacing.five,
        },
      ]}>
      {/* Bar de progression */}
      <View style={styles.progressBar}>
        {stepIndex > 0 ? (
          <Pressable
            onPress={prev}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              { opacity: pressed ? 0.5 : 1 },
            ]}>
            <SymbolView
              name="chevron.left"
              size={20}
              tintColor={c.text}
              weight="medium"
            />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
        <View style={styles.progressDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                {
                  backgroundColor:
                    i <= stepIndex ? c.gold : c.borderFaint,
                  width: i === stepIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {step === 'welcome' && <WelcomeStep />}
        {step === 'pseudo' && (
          <PseudoStep
            value={displayName}
            status={pseudoStatus}
            onChange={(v) => {
              setDisplayName(v);
              setPseudoStatus(v ? 'idle' : 'idle');
            }}
            onStatusChange={setPseudoStatus}
            checkAvailable={checkDisplayNameAvailable}
          />
        )}
        {step === 'dob' && (
          <DOBStep
            value={dobISO}
            age={age}
            onChange={(iso) => {
              setDobISO(iso);
              setAge(iso ? computeAge(iso, Date.now()) : -1);
            }}
          />
        )}
        {step === 'sports' && (
          <SportsStep selected={sportsFollowed} onToggle={toggleSport} />
        )}
        {step === 'risk' && (
          <RiskStep selected={riskLevel} onSelect={setRiskLevel} />
        )}
        {step === 'notifs' && (
          <NotifsStep
            optedIn={notificationsOptedIn}
            onActivate={() => setNotificationsOptedIn(true)}
          />
        )}
        {step === 'pack' && (
          <PackStep
            onStartTrial={startTrialAndFinish}
            onWaitlist={(p) => setWaitlistPack(p)}
            submitting={submitting}
          />
        )}
      </ScrollView>

      {/* Modal liste d'attente Pro/VIP (RevenueCat pas encore branché) */}
      <WaitlistModal
        pack={waitlistPack}
        onClose={() => setWaitlistPack(null)}
      />

      {/* Erreur d'API si la dernière étape échoue */}
      {error ? (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      ) : null}

      {/* CTAs en bas */}
      <View style={styles.cta}>
        {step === 'pack' ? null : step === 'notifs' ? (
          <>
            <BrandedButton
              label={
                notificationsOptedIn
                  ? '✓ Notifications activées'
                  : 'Activer les notifications'
              }
              onPress={async () => {
                // Demande la VRAIE permission iOS + récupère le token push
                if (session?.user.id) {
                  const { error: pushErr } = await registerForPushNotifications(
                    session.user.id,
                  );
                  if (pushErr && !pushErr.includes('appareil physique')) {
                    // L'user a refusé la permission iOS — on n'enregistre pas
                    // l'opt-in pour ne pas mentir. On passe à l'étape suivante.
                    next();
                    return;
                  }
                }
                setNotificationsOptedIn(true);
                next();
              }}
              disabled={notificationsOptedIn}
            />
            <BrandedButton
              label={notificationsOptedIn ? 'Continuer' : 'Plus tard'}
              variant={notificationsOptedIn ? 'primary' : 'ghost'}
              onPress={next}
            />
          </>
        ) : (
          <BrandedButton
            label={step === 'welcome' ? 'Commencer' : 'Continuer'}
            onPress={next}
            disabled={!canContinue()}
          />
        )}

        <Pressable
          onPress={() => router.push('/legal')}
          hitSlop={6}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            alignSelf: 'center',
          })}>
          <Text style={[styles.legalLink, { color: c.textDim }]}>
            Informations légales
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// =============================================================================
// Steps internes
// =============================================================================

function WelcomeStep() {
  const c = useThemeColors();
  return (
    <View style={styles.stepContainer}>
      <Image
        source={require('@/assets/images/aj-pronos-logo.png')}
        style={styles.welcomeLogo}
        contentFit="contain"
      />
      <Text style={[styles.eyebrow, { color: c.gold }]}>— BIENVENUE</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        Le pari sportif avec méthode.
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Chaque jour, notre analyste publie ses pronostics avec analyse
        détaillée. Transparence totale : gains et pertes affichés.
      </Text>
      <View style={styles.welcomePromise}>
        <PromiseRow icon="checkmark.seal.fill" text="Expertise humaine, pas un robot." />
        <PromiseRow icon="checkmark.seal.fill" text="Méthode rigoureuse et constante." />
        <PromiseRow icon="checkmark.seal.fill" text="Sans engagement, résiliable à tout moment." />
      </View>
    </View>
  );
}

function PromiseRow({ icon, text }: { icon: string; text: string }) {
  const c = useThemeColors();
  return (
    <View style={styles.promiseRow}>
      <SymbolView name={icon as never} size={18} tintColor={c.gold} weight="semibold" />
      <Text style={[styles.promiseText, { color: c.text }]}>{text}</Text>
    </View>
  );
}

function PseudoStep({
  value,
  status,
  onChange,
  onStatusChange,
  checkAvailable,
}: {
  value: string;
  status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  onChange: (v: string) => void;
  onStatusChange: (
    s: 'idle' | 'checking' | 'available' | 'taken' | 'invalid',
  ) => void;
  checkAvailable: (name: string) => Promise<boolean>;
}) {
  const c = useThemeColors();

  // Debounce de la vérification disponibilité (500ms après dernière frappe)
  useEffect(() => {
    if (!value) {
      onStatusChange('idle');
      return;
    }
    if (!PSEUDO_REGEX.test(value)) {
      onStatusChange('invalid');
      return;
    }
    let cancelled = false;
    onStatusChange('checking');
    const id = setTimeout(async () => {
      const available = await checkAvailable(value);
      if (cancelled) return;
      onStatusChange(available ? 'available' : 'taken');
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [value, checkAvailable, onStatusChange]);

  const hint =
    status === 'idle'
      ? '3 à 20 caractères. Lettres, chiffres, _ ou - uniquement.'
      : status === 'invalid'
      ? 'Caractères non autorisés ou longueur invalide (3 à 20 chars).'
      : status === 'checking'
      ? 'Vérification de la disponibilité…'
      : status === 'taken'
      ? 'Ce pseudo est déjà pris. Essaie autre chose.'
      : '✓ Pseudo disponible.';
  const hintColor =
    status === 'available'
      ? c.success
      : status === 'taken' || status === 'invalid'
      ? c.danger
      : c.textMuted;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— TON PSEUDO</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        Comment veux-tu qu’on t’appelle ?
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Ton pseudo est visible des autres membres dans le salon VIP (si tu
        prends ce pack) et identifie ton compte. Pas besoin de mettre ton
        vrai nom.
      </Text>

      <View
        style={[
          styles.pseudoBox,
          {
            backgroundColor: c.bgElevated,
            borderColor:
              status === 'available'
                ? c.success
                : status === 'taken' || status === 'invalid'
                ? c.danger
                : c.borderSoft,
          },
        ]}>
        <Text style={[styles.pseudoPrefix, { color: c.textDim }]}>@</Text>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="pseudo"
          placeholderTextColor={c.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          style={[styles.pseudoInput, { color: c.text }]}
        />
      </View>
      <Text style={[styles.fieldHint, { color: hintColor }]}>{hint}</Text>
    </View>
  );
}

function DOBStep({
  value,
  age,
  onChange,
}: {
  value: string;
  age: number;
  onChange: (iso: string) => void;
}) {
  const c = useThemeColors();
  // Saisie JJ/MM/AAAA (input texte avec masque léger côté validation)
  // Sur iOS on pourrait utiliser DateTimePicker mais ça complique le scroll —
  // input texte = clavier numérique pad, plus simple et standard pour DOB.

  function handleChange(raw: string) {
    // Auto-formatage : insère les / automatiquement
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }
    // Si la date est complète (8 chiffres), on essaie de parser en ISO
    if (digits.length === 8) {
      const dd = parseInt(digits.slice(0, 2), 10);
      const mm = parseInt(digits.slice(2, 4), 10);
      const yyyy = parseInt(digits.slice(4, 8), 10);
      // Validation basique
      if (
        dd >= 1 &&
        dd <= 31 &&
        mm >= 1 &&
        mm <= 12 &&
        yyyy >= 1900 &&
        yyyy <= new Date().getFullYear()
      ) {
        const iso = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
        onChange(iso);
      } else {
        onChange('');
      }
    } else {
      onChange('');
    }
    // Pour afficher le texte formatté, on stocke aussi en local
    setDisplayText(formatted);
  }

  const [displayText, setDisplayText] = useState(() => {
    if (!value) return '';
    const [yyyy, mm, dd] = value.split('-');
    return `${dd}/${mm}/${yyyy}`;
  });

  const isTooYoung = value && age >= 0 && age < MIN_AGE;
  const isOk = value && age >= MIN_AGE;

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— +18 OBLIGATOIRE</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        Quelle est ta date de naissance ?
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Les paris sportifs sont strictement réservés aux personnes majeures.
        Toute fausse déclaration entraîne la résiliation du compte.
      </Text>

      <View
        style={[
          styles.dobBox,
          {
            backgroundColor: c.bgElevated,
            borderColor: isOk
              ? c.success
              : isTooYoung
              ? c.danger
              : c.borderSoft,
          },
        ]}>
        <TextInput
          value={displayText}
          onChangeText={handleChange}
          placeholder="JJ/MM/AAAA"
          placeholderTextColor={c.textDim}
          keyboardType="number-pad"
          maxLength={10}
          style={[styles.dobInput, { color: c.text }]}
        />
      </View>

      {isTooYoung ? (
        <View
          style={[
            styles.dobErrorBlock,
            { backgroundColor: 'rgba(185, 28, 28, 0.08)', borderColor: c.danger },
          ]}>
          <Text style={[styles.dobErrorTitle, { color: c.danger }]}>
            Service réservé aux personnes majeures (+18 ans).
          </Text>
          <Text style={[styles.dobErrorBody, { color: c.text }]}>
            D’après cette date, tu as {age} an{age > 1 ? 's' : ''}. Le service
            n’est pas accessible aux mineurs. Si tu pratiques le pari et que
            tu as besoin d’aide, contacte Joueurs Info Service.
          </Text>
          <Pressable
            onPress={() =>
              Linking.openURL('https://www.joueurs-info-service.fr')
            }
            hitSlop={6}>
            <Text style={[styles.helpLink, { color: c.gold }]}>
              joueurs-info-service.fr →
            </Text>
          </Pressable>
        </View>
      ) : isOk ? (
        <Text style={[styles.fieldHint, { color: c.success }]}>
          ✓ Tu as {age} ans. Bienvenue.
        </Text>
      ) : (
        <Text style={[styles.fieldHint, { color: c.textMuted }]}>
          Format attendu : JJ/MM/AAAA (par ex. 15/06/1990).
        </Text>
      )}
    </View>
  );
}

function SportsStep({
  selected,
  onToggle,
}: {
  selected: Sport[];
  onToggle: (s: Sport) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— TES SPORTS</Text>
      <Text style={[styles.h1, { color: c.text }]}>Quels sports te suivent ?</Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        On adapte tes notifications et la mise en avant des pronostics. Tu
        pourras changer ça à tout moment depuis les Préférences.
      </Text>

      <View style={styles.sportsGrid}>
        {SPORT_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.value);
          return (
            <Pressable
              key={opt.value}
              onPress={() => onToggle(opt.value)}
              style={({ pressed }) => [
                styles.sportCard,
                {
                  backgroundColor: isSelected ? c.bgWarm : c.bgElevated,
                  borderColor: isSelected ? c.gold : c.borderSoft,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <SymbolView
                name={opt.icon as never}
                size={36}
                tintColor={isSelected ? c.gold : c.textMuted}
                weight="semibold"
              />
              <Text
                style={[
                  styles.sportLabel,
                  {
                    color: isSelected ? c.text : c.textMuted,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {opt.label}
              </Text>
              {isSelected ? (
                <View
                  style={[styles.sportCheck, { backgroundColor: c.gold }]}>
                  <SymbolView
                    name="checkmark"
                    size={10}
                    tintColor={c.bg}
                    weight="bold"
                  />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.helpLink, { color: c.textDim }]}>
        Bientôt : basket, rugby, hockey (via analyse IA spécialisée).
      </Text>
    </View>
  );
}

function RiskStep({
  selected,
  onSelect,
}: {
  selected: RiskLevel;
  onSelect: (r: RiskLevel) => void;
}) {
  const c = useThemeColors();
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— TON APPROCHE</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        Quelle est ton approche du pari ?
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        On met en avant les pronostics qui collent à ton style. Tu vois tout,
        mais les recommandations s’adaptent.
      </Text>

      <View style={styles.riskList}>
        {RISK_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              style={({ pressed }) => [
                styles.riskCard,
                {
                  backgroundColor: isSelected ? c.bgWarm : c.bgElevated,
                  borderColor: isSelected ? c.gold : c.borderSoft,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <View
                style={[
                  styles.radio,
                  {
                    borderColor: isSelected ? c.gold : c.borderStrong,
                  },
                ]}>
                {isSelected ? (
                  <View
                    style={[styles.radioDot, { backgroundColor: c.gold }]}
                  />
                ) : null}
              </View>
              <View style={styles.riskTextBlock}>
                <Text style={[styles.riskLabel, { color: c.text }]}>
                  {opt.label}
                </Text>
                <Text
                  style={[styles.riskBaseline, { color: c.textMuted }]}>
                  {opt.baseline}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NotifsStep({
  optedIn,
  onActivate,
}: {
  optedIn: boolean;
  onActivate: () => void;
}) {
  const c = useThemeColors();
  // onActivate utilisé pour future-proof si on veut activer depuis l'illustration.
  void onActivate;
  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— NOTIFICATIONS</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        On te prévient à chaque nouveau prono ?
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Nos pronostics foot sont publiés 1h avant le coup d’envoi. Sans
        notification, tu risques de les rater. Tu peux désactiver à tout
        moment depuis tes Préférences.
      </Text>

      <View
        style={[
          styles.notifPreview,
          { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
        ]}>
        <View style={styles.notifPreviewHead}>
          <View
            style={[
              styles.notifIcon,
              { backgroundColor: c.text },
            ]}>
            <Image
              source={require('@/assets/images/aj-pronos-logo.png')}
              style={styles.notifIconLogo}
              contentFit="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.notifTitle, { color: c.text }]}>
              AJ Pronos · maintenant
            </Text>
            <Text style={[styles.notifBody, { color: c.textMuted }]}>
              Nouveau prono : PSG - Lyon, victoire PSG (cote 1.85). Analyse
              complète dispo dans l’app.
            </Text>
          </View>
        </View>
      </View>

      {optedIn ? (
        <View
          style={[
            styles.activatedRow,
            { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
          ]}>
          <SymbolView
            name="checkmark.circle.fill"
            size={20}
            tintColor={c.gold}
            weight="semibold"
          />
          <Text style={[styles.activatedText, { color: c.text }]}>
            Notifications activées.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PackStep({
  onStartTrial,
  onWaitlist,
  submitting,
}: {
  onStartTrial: () => void;
  onWaitlist: (pack: Pack) => void;
  submitting: boolean;
}) {
  const c = useThemeColors();

  // Pour Starter : on offre les 7 jours (handler dédié).
  // Pour Pro/VIP : la carte mène à la modal liste d'attente
  // (sera remplacée par le checkout Apple IAP via RevenueCat).
  function handleCardPress(pack: Pack) {
    if (pack.tier === 'starter') {
      // Sur Starter, la card ne déclenche PAS le trial direct :
      // on demande à l'utilisateur de cliquer le bouton dédié sous
      // les cartes, qui est plus explicite sur "essai gratuit".
      // Si l'utilisateur veut s'abonner Starter direct, on l'envoie
      // sur la même waitlist (l'abo payant Starter sera dispo via
      // RevenueCat en même temps que Pro et VIP).
      onWaitlist(pack);
      return;
    }
    onWaitlist(pack);
  }

  return (
    <View style={styles.stepContainer}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— DERNIÈRE ÉTAPE</Text>
      <Text style={[styles.h1, { color: c.text }]}>Choisis ton pack.</Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Pour démarrer, sélectionne un pack. L’essai{' '}
        <Text style={{ color: c.text, fontWeight: '700' }}>7 jours offerts</Text>{' '}
        est réservé au pack Starter — sans carte bancaire, sans engagement.
      </Text>

      {/* Les 3 cartes de packs (même style que /subscribe) */}
      <View style={styles.packsList}>
        {PACKS.map((pack) => (
          <PricingCard
            key={pack.tier}
            pack={pack}
            isCurrent={false}
            onPress={() => handleCardPress(pack)}
          />
        ))}
      </View>

      {/* CTA principal — démarrer l'essai 7j Starter sans CB */}
      <Pressable
        onPress={onStartTrial}
        disabled={submitting}
        style={({ pressed }) => [
          styles.trialCta,
          {
            backgroundColor: c.ctaBg,
            opacity: pressed || submitting ? 0.75 : 1,
          },
        ]}>
        <SymbolView
          name="gift.fill"
          size={16}
          tintColor={c.ctaText}
          weight="semibold"
        />
        <Text style={[styles.trialCtaText, { color: c.ctaText }]}>
          {submitting
            ? 'Activation…'
            : 'Démarrer mes 7 jours offerts (Starter)'}
        </Text>
      </Pressable>
      <Text style={[styles.trialCtaNote, { color: c.textDim }]}>
        Aucune CB requise. À la fin des 7 jours, tu choisis de t’abonner
        ou l’accès s’arrête. Aucun débit automatique.
      </Text>
    </View>
  );
}

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDots: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.four,
  },
  stepContainer: {
    gap: Spacing.three,
  },
  welcomeLogo: {
    width: 140,
    height: 173,
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  h1: {
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
  },
  welcomePromise: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  promiseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  promiseText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  helpLink: {
    fontSize: 13,
    marginTop: Spacing.two,
  },
  pseudoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  pseudoPrefix: {
    fontSize: 22,
    fontWeight: '700',
  },
  pseudoInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    paddingVertical: Spacing.two,
  },
  fieldHint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 6,
  },
  dobBox: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.three,
  },
  dobInput: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  dobErrorBlock: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
    marginTop: Spacing.two,
  },
  dobErrorTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  dobErrorBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  sportsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  sportCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    position: 'relative',
  },
  sportLabel: {
    fontSize: 15,
  },
  sportCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  riskList: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  riskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  riskTextBlock: {
    flex: 1,
    gap: 2,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  riskBaseline: {
    fontSize: 13,
    lineHeight: 18,
  },
  notifPreview: {
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.three,
  },
  notifPreviewHead: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notifIconLogo: {
    width: 30,
    height: 30,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  notifBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  activatedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  activatedText: {
    fontSize: 13,
    fontWeight: '600',
  },
  packsList: {
    gap: Spacing.four,
    marginTop: Spacing.three,
  },
  trialCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    marginTop: Spacing.three,
  },
  trialCtaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  trialCtaNote: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: 6,
  },
  cta: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
  error: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
  },
  legalLink: {
    fontSize: 12,
    textDecorationLine: 'underline',
    marginTop: 4,
  },
});
