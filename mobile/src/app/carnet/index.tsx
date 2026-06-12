import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, Spacing } from '@/constants/theme';
import { formatLongDate } from '@/lib/format-date';
import { useAllBets } from '@/lib/use-all-bets';
import { useUserBets } from '@/lib/use-user-bets';
import { useThemeColors } from '@/lib/use-theme-colors';
import type { AnyBet } from '@/types/prono';
import type { UserBet } from '@/types/user-bet';

/**
 * Détermine le sport pour le bg de card depuis le bet original (pour
 * rétro-compat des user_bets DB dont le snapshot n'a pas encore de
 * sport). Returns 'foot' | 'tennis' | 'mixed'.
 */
function resolveBetSport(
  bet: AnyBet | undefined,
  snapshotSport: 'foot' | 'tennis' | 'mixed' | undefined,
): 'foot' | 'tennis' | 'mixed' {
  if (snapshotSport) return snapshotSport;
  if (!bet) return 'foot';
  if (bet.type === 'single') return bet.sport;
  const sportSet = new Set(bet.selections.map((s) => s.sport));
  if (sportSet.size === 1 && sportSet.has('tennis')) return 'tennis';
  if (sportSet.size === 1 && sportSet.has('foot')) return 'foot';
  return 'mixed';
}

export default function CarnetScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userBets, personalRoi, isLoading } = useUserBets();
  const { bets: allBets } = useAllBets();

  if (isLoading) {
    return (
      <View style={[styles.fallback, { backgroundColor: c.bg }]}>
        <Text style={[styles.fallbackText, { color: c.textMuted }]}>
          Chargement…
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* Background : même image que la page Stats (rayures dorées) */}
      <ExpoImage
        source={require('@/assets/images/bg-stats.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.bgOverlay} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 60 },
        ]}
        showsVerticalScrollIndicator={false}>
        {userBets.length === 0 ? (
          <EmptyState onCta={() => router.push('/(app)/pronos')} />
        ) : (
          <>
            <View style={styles.headerBlock}>
              <Text style={[styles.eyebrow, { color: c.gold }]}>
                — TON BILAN PERSONNEL
              </Text>
              <Text style={[styles.h1, { color: c.text }]}>
                {personalRoi.totalPlayed} pari
                {personalRoi.totalPlayed > 1 ? 's' : ''} suivi
                {personalRoi.totalPlayed > 1 ? 's' : ''}
                <Text style={{ color: c.gold }}>.</Text>
              </Text>
            </View>

            <BilanCard personalRoi={personalRoi} />

            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: 'rgba(232,201,90,0.15)' },
                ]}>
                <SymbolView
                  name="info.circle.fill"
                  size={14}
                  tintColor={c.gold}
                  weight="semibold"
                />
              </View>
              <Text style={[styles.infoText, { color: c.textMuted }]}>
                Calculé sur tes mises renseignées.{'\n'}
                Performance passée, ne préjuge pas du futur.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.gold }]}>
                — TES PARIS
              </Text>
              <View style={{ gap: Spacing.three }}>
                {[...userBets]
                  .sort(
                    (a, b) =>
                      new Date(b.bet_snapshot.matchStartAt).getTime() -
                      new Date(a.bet_snapshot.matchStartAt).getTime(),
                  )
                  .map((ub) => (
                  <UserBetCard
                    key={ub.id}
                    ub={ub}
                    resolvedSport={resolveBetSport(
                      allBets.find((b) => b.id === ub.bet_id),
                      ub.bet_snapshot.sport,
                    )}
                    onPress={() => {
                      if (router.canDismiss()) {
                        router.dismiss();
                      }
                      setTimeout(() => {
                        router.push({
                          pathname: '/(app)/pronos/[id]',
                          params: { id: ub.bet_id },
                        });
                      }, 80);
                    }}
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function EmptyState({ onCta }: { onCta: () => void }) {
  const c = useThemeColors();
  return (
    <View style={styles.emptyBlock}>
      <Text style={[styles.eyebrow, { color: c.gold }]}>— TON CARNET</Text>
      <Text style={[styles.h1, { color: c.text }]}>
        Marque tes premiers paris
        <Text style={{ color: c.gold }}>.</Text>
      </Text>
      <Text style={[styles.lead, { color: c.textMuted }]}>
        Ouvre n’importe quel pronostic d’AJ Pronos, et touche le bouton
        « J’ai joué ce pari » en bas pour l’ajouter ici. Tu pourras
        renseigner ta mise (optionnel) et suivre ton ROI réel.
      </Text>
      <Pressable
        onPress={onCta}
        style={({ pressed }) => [
          styles.emptyCta,
          { backgroundColor: c.gold, opacity: pressed ? 0.85 : 1 },
        ]}>
        <Text style={[styles.emptyCtaText, { color: '#0A0A0A' }]}>
          Voir les pronostics →
        </Text>
      </Pressable>
    </View>
  );
}

function BilanCard({
  personalRoi,
}: {
  personalRoi: ReturnType<typeof useUserBets>['personalRoi'];
}) {
  const c = useThemeColors();
  const netColor =
    personalRoi.netGain > 0
      ? c.success
      : personalRoi.netGain < 0
        ? c.danger
        : c.text;
  const roiColor =
    personalRoi.realRoi > 0
      ? c.success
      : personalRoi.realRoi < 0
        ? c.danger
        : c.text;

  return (
    <View
      style={[
        styles.bilanCard,
        {
          backgroundColor: c.bgElevated,
          borderColor: c.gold,
          shadowColor: c.gold,
        },
      ]}>
      <View style={styles.bilanRow}>
        {/* Cellule % réussite avec cercle décoratif doré */}
        <View style={styles.bilanCell}>
          <View style={styles.circleWrap}>
            <View
              style={[styles.circleProgress, { borderColor: c.gold }]}
              pointerEvents="none"
            />
            <Text
              style={[styles.bilanValue, { color: c.text }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}>
              {personalRoi.winRate}%
            </Text>
          </View>
          <Text style={[styles.bilanLabel, { color: c.text }]}>Réussite</Text>
          <Text style={[styles.bilanSub, { color: c.textDim }]}>
            {personalRoi.wins}V · {personalRoi.losses}D
            {personalRoi.voids > 0 ? ` · ${personalRoi.voids}A` : ''}
          </Text>
        </View>

        <View style={styles.bilanCell}>
          <View style={styles.valueWrap}>
            <Text
              style={[styles.bilanValue, { color: netColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.4}>
              {personalRoi.totalStaked > 0
                ? `${personalRoi.netGain >= 0 ? '+' : ''}${personalRoi.netGain.toFixed(2)}€`
                : '—'}
            </Text>
          </View>
          <Text style={[styles.bilanLabel, { color: c.text }]}>Gain net</Text>
          <Text style={[styles.bilanSub, { color: c.textDim }]}>
            {personalRoi.totalStaked > 0
              ? `sur ${personalRoi.totalStaked.toFixed(2)}€ misés`
              : 'ajoute tes mises'}
          </Text>
        </View>

        <View style={styles.bilanCell}>
          <View style={styles.valueWrap}>
            <Text
              style={[styles.bilanValue, { color: roiColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.5}>
              {personalRoi.totalStaked > 0
                ? `${personalRoi.realRoi > 0 ? '+' : ''}${personalRoi.realRoi}%`
                : '—'}
            </Text>
          </View>
          <Text style={[styles.bilanLabel, { color: c.text }]}>ROI réel</Text>
          <Text style={[styles.bilanSub, { color: c.textDim }]}>
            {personalRoi.pending > 0
              ? `${personalRoi.pending} en attente`
              : 'tous résolus'}
          </Text>
        </View>
      </View>

      {/* Ornement bas : icône graphique dans encoche dorée */}
      <View style={styles.cardNotch} pointerEvents="none">
        <View
          style={[
            styles.cardNotchInner,
            { backgroundColor: c.bgElevated, borderColor: c.gold },
          ]}>
          <SymbolView
            name="chart.line.uptrend.xyaxis"
            size={14}
            tintColor={c.gold}
            weight="semibold"
          />
        </View>
      </View>
    </View>
  );
}

/** Mapping sport + résultat → asset d'image background pour la card.
 *  - "foot"   → ballon foot vert/rouge
 *  - "tennis" → balle tennis verte/rouge
 *  - "mixed"  → bg combo mixte (ballon + balle)
 *  - undefined → fallback foot pour rétro-compat des anciens snapshots */
function getBetCardBg(
  sport: string | undefined,
  result: 'win' | 'loss',
) {
  if (sport === 'tennis') {
    return result === 'win'
      ? require('@/assets/images/bg-card-won-tennis.png')
      : require('@/assets/images/bg-card-lost-tennis.png');
  }
  if (sport === 'mixed') {
    return result === 'win'
      ? require('@/assets/images/bg-card-won-combo.png')
      : require('@/assets/images/bg-card-lost-combo.png');
  }
  return result === 'win'
    ? require('@/assets/images/bg-card-won.png')
    : require('@/assets/images/bg-card-lost.png');
}

function UserBetCard({
  ub,
  resolvedSport,
  onPress,
}: {
  ub: UserBet;
  /** Sport résolu (snapshot OU bet original) pour le choix du bg. */
  resolvedSport: 'foot' | 'tennis' | 'mixed';
  onPress: () => void;
}) {
  const c = useThemeColors();
  const snap = ub.bet_snapshot;
  const isWin = snap.result === 'win';
  const isLoss = snap.result === 'loss';
  const isVoid = snap.result === 'void';
  const isPending = !isWin && !isLoss && !isVoid;

  const accentColor = isWin
    ? c.success
    : isLoss
      ? c.danger
      : isVoid
        ? c.textDim
        : c.gold;
  const statusLabel = isWin
    ? 'GAGNÉ'
    : isLoss
      ? 'PERDU'
      : isVoid
        ? 'ANNULÉ'
        : 'EN ATTENTE';
  const statusIcon = isWin
    ? 'trophy.fill'
    : isLoss
      ? 'xmark'
      : isVoid
        ? 'minus.circle'
        : 'clock';

  const bgSource =
    isWin || isLoss
      ? getBetCardBg(resolvedSport, isWin ? 'win' : 'loss')
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.betCard,
        { opacity: pressed ? 0.85 : 1, borderColor: accentColor },
      ]}>
      {bgSource ? (
        <ImageBackground
          source={bgSource}
          style={styles.betCardBg}
          imageStyle={styles.betCardBgImg}>
          <View style={styles.betCardDim} pointerEvents="none" />
          <BetCardContent
            ub={ub}
            statusLabel={statusLabel}
            accentColor={accentColor}
            statusIcon={statusIcon}
            pendingOrVoid={isPending || isVoid}
          />
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.betCardPlain,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}>
          <BetCardContent
            ub={ub}
            statusLabel={statusLabel}
            accentColor={accentColor}
            statusIcon={statusIcon}
            pendingOrVoid={isPending || isVoid}
          />
        </View>
      )}
    </Pressable>
  );
}

function BetCardContent({
  ub,
  statusLabel,
  accentColor,
  statusIcon,
  pendingOrVoid,
}: {
  ub: UserBet;
  statusLabel: string;
  accentColor: string;
  statusIcon: string;
  pendingOrVoid: boolean;
}) {
  const c = useThemeColors();
  const snap = ub.bet_snapshot;
  return (
    <View style={styles.betCardContent}>
      <View style={styles.betCardHeader}>
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor: 'rgba(0,0,0,0.45)',
              borderColor: accentColor,
            },
          ]}>
          <SymbolView
            name={statusIcon as never}
            size={12}
            tintColor={accentColor}
            weight="semibold"
          />
          <Text style={[styles.statusPillText, { color: accentColor }]}>
            {statusLabel}
          </Text>
        </View>
        <Text style={[styles.betCardDate, { color: c.text }]}>
          {formatLongDate(snap.matchStartAt)}
        </Text>
      </View>

      <View style={styles.betCardBody}>
        <View style={styles.betCardBodyLeft}>
          <Text
            style={[styles.betCardTitle, { color: c.text }]}
            numberOfLines={1}>
            {snap.title}
          </Text>
          <Text
            style={[styles.betCardSub, { color: c.textMuted }]}
            numberOfLines={1}>
            {snap.competition ?? 'Sport indéfini'} · cote{' '}
            {snap.odd.toFixed(2)}
            {ub.stake != null ? ` · mise ${ub.stake.toFixed(2)}€` : ''}
          </Text>
          {ub.notes ? (
            <Text
              style={[styles.betCardNotes, { color: c.textMuted }]}
              numberOfLines={2}>
              « {ub.notes} »
            </Text>
          ) : null}
        </View>
        <SymbolView
          name="chevron.right"
          size={18}
          tintColor={pendingOrVoid ? c.textDim : c.text}
          weight="semibold"
        />
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
    backgroundColor: 'rgba(10,10,10,0.55)',
  },
  container: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 14,
  },
  emptyBlock: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  emptyCta: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  emptyCtaText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerBlock: {
    gap: 8,
    marginTop: Spacing.two,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  h1: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  lead: {
    fontSize: 14,
    lineHeight: 20,
  },
  // === Card bilan ===
  bilanCard: {
    padding: Spacing.three,
    paddingBottom: Spacing.four,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: Spacing.three,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
    position: 'relative',
  },
  bilanRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
  },
  bilanCell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  circleWrap: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Même hauteur que circleWrap pour aligner verticalement "+56€" et "+19%"
  // avec le "50%" qui est centré dans son cercle.
  valueWrap: {
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleProgress: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 42,
    borderWidth: 2.5,
    borderTopColor: 'transparent',
    transform: [{ rotate: '135deg' }],
    opacity: 0.85,
  },
  bilanValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  bilanLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 8,
  },
  bilanSub: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  cardNotch: {
    position: 'absolute',
    bottom: -16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cardNotchInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // === Info row ===
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: Spacing.two,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  // === Section paris ===
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '700',
  },
  // === Bet card ===
  betCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  betCardBg: {
    overflow: 'hidden',
  },
  betCardBgImg: {
    borderRadius: 16,
    resizeMode: 'cover',
  },
  betCardDim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.40)',
  },
  betCardPlain: {
    borderRadius: 16,
  },
  betCardContent: {
    padding: Spacing.three,
    gap: 10,
  },
  betCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1.2,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  betCardDate: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  betCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  betCardBodyLeft: {
    flex: 1,
    gap: 4,
  },
  betCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  betCardSub: {
    fontSize: 13,
  },
  betCardNotes: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
