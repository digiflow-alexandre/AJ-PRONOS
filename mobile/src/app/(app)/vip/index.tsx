import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandedButton } from '@/components/branded-button';
import { BrandHeader } from '@/components/brand-header';
import { EmojiReactionPicker } from '@/components/vip-chat/emoji-reaction-picker';
import { MentionAutocomplete } from '@/components/vip-chat/mention-autocomplete';
import { MentionText } from '@/components/vip-chat/mention-text';
import { ReplyPreview } from '@/components/vip-chat/reply-preview';
import { Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useProfile } from '@/lib/use-profile';
import { useThemeColors } from '@/lib/use-theme-colors';
import { useVipMessages } from '@/lib/use-vip-messages';
import { useVipParticipants } from '@/lib/use-vip-participants';
import { useVipReactions, type ReactionGroup } from '@/lib/use-vip-reactions';
import { useVipReads } from '@/lib/use-vip-reads';
import type { VipMessage, VipParticipant } from '@/types/vip-message';

export default function VipSalonScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { isStaff, profile } = useProfile();
  const {
    messages,
    isLoading,
    hasAccess,
    sendMessage,
    deleteMessage,
  } = useVipMessages();
  const { participants } = useVipParticipants();
  const { reactionsByMessage, toggleReaction } = useVipReactions();
  const { markRead, getReadCount } = useVipReads();

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [coachingOpen, setCoachingOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<VipMessage | null>(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState<string | null>(null);
  const listRef = useRef<FlatList<VipMessage>>(null);

  // Auto-scroll en bas quand un nouveau message arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Marquer le dernier message comme lu à chaque nouveau message reçu
  useEffect(() => {
    if (messages.length > 0 && hasAccess) {
      const lastId = messages[messages.length - 1].id;
      markRead(lastId);
    }
  }, [messages, hasAccess, markRead]);

  // === Mention autocomplete : parse l'input pour détecter @... ===
  const mentionQuery = useMemo(() => {
    // Cherche un @ + suite de caractères au curseur (= en fin de string pour V1)
    const match = input.match(/(?:^|\s)@([a-zA-Z0-9_-]*)$/);
    return match ? match[1] : null;
  }, [input]);

  function handleMentionSelect(displayName: string) {
    // Remplace le @... en cours par @displayName + espace
    const newInput = input.replace(/(?:^|\s)@([a-zA-Z0-9_-]*)$/, (m, prefix) => {
      const leading = m.startsWith(' ') ? ' ' : '';
      return `${leading}@${displayName} `;
    });
    setInput(newInput);
  }

  // === Parse les mentions dans le content envoyé → IDs des users mentionnés ===
  function extractMentionedIds(
    content: string,
    pool: VipParticipant[],
  ): string[] {
    const regex = /@([a-zA-Z0-9_-]+)/g;
    const ids = new Set<string>();
    let m: RegExpExecArray | null;
    while ((m = regex.exec(content)) !== null) {
      const pseudo = m[1].toLowerCase();
      const found = pool.find((p) => p.display_name.toLowerCase() === pseudo);
      if (found) ids.add(found.id);
    }
    return Array.from(ids);
  }

  // === Gating ===
  if (!hasAccess) {
    return <LockedScreen onUpgrade={() => router.push('/(app)/subscribe')} />;
  }

  async function onSend() {
    const trimmed = input.trim();
    if (!trimmed) return;
    setSending(true);
    const mentionedIds = extractMentionedIds(trimmed, participants);
    const { error } = await sendMessage(trimmed, {
      replyToId: replyTo?.id,
      replyToSnapshot: replyTo
        ? {
            sender_display_name: replyTo.sender_display_name,
            sender_role: replyTo.sender_role,
            content: replyTo.content,
          }
        : undefined,
      mentionedUserIds: mentionedIds.length > 0 ? mentionedIds : undefined,
    });
    setSending(false);
    if (error) {
      Alert.alert('Envoi échoué', error);
      return;
    }
    setInput('');
    setReplyTo(null);
  }

  function onLongPressMessage(msg: VipMessage) {
    if (msg.deleted_at) return;
    const options: string[] = ['Annuler', 'Répondre', 'Réagir avec un emoji'];
    let destructiveIdx = -1;
    if (isStaff) {
      options.push('Supprimer (modération)');
      destructiveIdx = options.length - 1;
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 0,
        destructiveButtonIndex: destructiveIdx >= 0 ? destructiveIdx : undefined,
      },
      async (idx) => {
        if (idx === 1) {
          setReplyTo(msg);
        } else if (idx === 2) {
          setReactionPickerMsgId(msg.id);
        } else if (idx === destructiveIdx && destructiveIdx > 0) {
          Alert.alert(
            'Supprimer ce message ?',
            'L’action est tracée pour audit.',
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Supprimer',
                style: 'destructive',
                onPress: async () => {
                  const { error } = await deleteMessage(msg.id);
                  if (error) Alert.alert('Erreur', error);
                },
              },
            ],
          );
        }
      },
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      {/* BG salon VIP : logo AJ doré sur fond stade éclairé */}
      <ExpoImage
        source={require('@/assets/images/bg-vip-salon.png')}
        style={styles.bgImage}
        contentFit="cover"
      />
      <View style={styles.bgOverlay} pointerEvents="none" />

      <BrandHeader />

      {/* Header salon avec bouton coaching */}
      <View
        style={[
          styles.salonHeader,
          { backgroundColor: c.bgWarm, borderBottomColor: c.goldDecorative },
        ]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.salonEyebrow, { color: c.gold }]}>
            — SALON VIP · {participants.length}{' '}
            {participants.length > 1 ? 'membres' : 'membre'}
          </Text>
          <Text style={[styles.salonTitle, { color: c.text }]}>
            Échanges avec Julien & les VIP
          </Text>
        </View>
        <Pressable
          onPress={() => setCoachingOpen(true)}
          style={({ pressed }) => [
            styles.coachingBtn,
            { backgroundColor: c.ctaBg, opacity: pressed ? 0.8 : 1 },
          ]}>
          <SymbolView
            name="person.fill.questionmark"
            size={14}
            tintColor={c.ctaText}
            weight="semibold"
          />
          <Text style={[styles.coachingBtnText, { color: c.ctaText }]}>
            Coaching
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 100}
        style={{ flex: 1 }}>
        {/* Liste des messages */}
        {isLoading ? (
          <View style={styles.loadingBlock}>
            <Text style={[styles.loadingText, { color: c.textDim }]}>
              Chargement du salon…
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Text style={[styles.emptyTitle, { color: c.text }]}>
              Le salon est encore tranquille.
            </Text>
            <Text style={[styles.emptyBody, { color: c.textMuted }]}>
              Sois le premier à écrire — partage un pari, pose une question
              à Julien, ou présente-toi aux autres VIP.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            contentContainerStyle={styles.list}
            renderItem={({ item, index }) => {
              const isMine = item.sender_id === session?.user.id;
              const isLastMine =
                isMine &&
                index === messages.length - 1;
              return (
                <MessageBubble
                  message={item}
                  isMine={isMine}
                  participants={participants}
                  reactions={reactionsByMessage.get(item.id) ?? []}
                  readCount={isLastMine ? getReadCount(item, messages) : 0}
                  showReadCount={isLastMine}
                  onLongPress={() => onLongPressMessage(item)}
                  onToggleReaction={(emoji) => toggleReaction(item.id, emoji)}
                />
              );
            }}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Mention autocomplete (au-dessus de l'input) */}
        <MentionAutocomplete
          query={mentionQuery}
          participants={participants}
          currentUserId={session?.user.id ?? null}
          onSelect={handleMentionSelect}
        />

        {/* Reply preview (au-dessus de l'input) */}
        {replyTo ? (
          <ReplyPreview
            message={replyTo}
            onCancel={() => setReplyTo(null)}
          />
        ) : null}

        {/* Input bas — paddingBottom inclut la hauteur de la tab bar custom
            flottante (~80px) pour ne pas être caché par elle. */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: c.bgElevated,
              borderTopColor: c.borderSoft,
              paddingBottom: insets.bottom + Spacing.two + 80,
            },
          ]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Écris un message…"
            placeholderTextColor={c.textDim}
            multiline
            maxLength={500}
            style={[
              styles.input,
              {
                backgroundColor: c.bgDeeper,
                borderColor: c.borderSoft,
                color: c.text,
              },
            ]}
          />
          <Pressable
            onPress={onSend}
            disabled={sending || !input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() ? c.gold : c.borderFaint,
                opacity: pressed || sending ? 0.7 : 1,
              },
            ]}>
            <SymbolView
              name="arrow.up"
              size={16}
              tintColor={input.trim() ? c.bg : c.textDim}
              weight="bold"
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Modal placeholder coaching (V1.1) */}
      <CoachingPlaceholderModal
        visible={coachingOpen}
        onClose={() => setCoachingOpen(false)}
      />

      {/* Emoji reaction picker (long-press → réagir) */}
      <EmojiReactionPicker
        visible={reactionPickerMsgId !== null}
        onSelect={async (emoji) => {
          if (reactionPickerMsgId) {
            await toggleReaction(reactionPickerMsgId, emoji);
          }
        }}
        onClose={() => setReactionPickerMsgId(null)}
      />

      {/* Hint pseudo manquant */}
      {!profile?.display_name ? (
        <View
          style={[
            styles.pseudoHint,
            { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
          ]}>
          <Text style={[styles.pseudoHintText, { color: c.text }]}>
            ⚠️ Ton pseudo n’est pas défini. Tes messages apparaîtront
            comme « anonyme ».
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function MessageBubble({
  message,
  isMine,
  participants,
  reactions,
  readCount,
  showReadCount,
  onLongPress,
  onToggleReaction,
}: {
  message: VipMessage;
  isMine: boolean;
  participants: VipParticipant[];
  reactions: ReactionGroup[];
  readCount: number;
  showReadCount: boolean;
  onLongPress: () => void;
  onToggleReaction: (emoji: string) => void;
}) {
  const c = useThemeColors();
  const isDeleted = !!message.deleted_at;
  const isStaffSender =
    message.sender_role === 'admin' || message.sender_role === 'validator';

  const bubbleBg = isMine
    ? c.ctaBg
    : isStaffSender
    ? c.bgWarm
    : c.bgElevated;
  const textColor = isMine ? c.ctaText : c.text;
  const senderColor = isMine
    ? c.ctaText
    : isStaffSender
    ? c.gold
    : c.textMuted;

  return (
    <View
      style={[
        styles.bubbleRow,
        { justifyContent: isMine ? 'flex-end' : 'flex-start' },
      ]}>
      <View style={styles.bubbleColumn}>
        <Pressable onLongPress={onLongPress} delayLongPress={500}>
          <View
            style={[
              styles.bubble,
              {
                backgroundColor: bubbleBg,
                borderColor: isStaffSender ? c.goldDecorative : c.borderSoft,
                borderWidth: isStaffSender ? 1 : StyleSheet.hairlineWidth,
                opacity: isDeleted ? 0.5 : 1,
              },
            ]}>
            {!isMine ? (
              <Text style={[styles.senderName, { color: senderColor }]}>
                {message.sender_display_name ?? 'anonyme'}
                {isStaffSender ? ' · ÉQUIPE AJ' : ''}
              </Text>
            ) : null}

            {/* Citation du message répondu */}
            {message.reply_to_snapshot ? (
              <View
                style={[
                  styles.replyQuote,
                  {
                    backgroundColor: isMine
                      ? 'rgba(255,255,255,0.12)'
                      : c.bgDeeper,
                    borderLeftColor: isMine ? c.ctaText : c.gold,
                  },
                ]}>
                <Text
                  style={[
                    styles.replyQuoteSender,
                    { color: isMine ? c.ctaText : c.gold },
                  ]}>
                  {message.reply_to_snapshot.sender_display_name ?? 'anonyme'}
                </Text>
                <Text
                  style={[
                    styles.replyQuoteText,
                    {
                      color: isMine ? c.ctaText : c.textMuted,
                      opacity: isMine ? 0.8 : 1,
                    },
                  ]}
                  numberOfLines={2}>
                  {message.reply_to_snapshot.content}
                </Text>
              </View>
            ) : null}

            {/* Contenu du message (avec mentions @ en doré) */}
            {isDeleted ? (
              <Text
                style={[
                  styles.bubbleText,
                  { color: textColor, fontStyle: 'italic' },
                ]}>
                [Message supprimé par modération]
              </Text>
            ) : (
              <MentionText
                content={message.content}
                participants={participants}
                baseColor={textColor}
              />
            )}

            <Text
              style={[
                styles.bubbleTime,
                { color: isMine ? c.ctaText : c.textDim, opacity: 0.7 },
              ]}>
              {formatTime(message.created_at)}
            </Text>
          </View>
        </Pressable>

        {/* Réactions sous la bulle */}
        {reactions.length > 0 ? (
          <View style={styles.reactionsRow}>
            {reactions.map((r) => (
              <Pressable
                key={r.emoji}
                onPress={() => onToggleReaction(r.emoji)}
                style={({ pressed }) => [
                  styles.reactionChip,
                  {
                    backgroundColor: r.hasMine ? c.bgWarm : c.bgElevated,
                    borderColor: r.hasMine ? c.gold : c.borderSoft,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}>
                <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                <Text
                  style={[
                    styles.reactionCount,
                    { color: r.hasMine ? c.gold : c.textMuted },
                  ]}>
                  {r.count}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* Read receipts pour mon dernier message */}
        {showReadCount && readCount > 0 ? (
          <Text style={[styles.readCount, { color: c.textDim }]}>
            ✓✓ Vu par {readCount}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function LockedScreen({ onUpgrade }: { onUpgrade: () => void }) {
  const c = useThemeColors();
  return (
    <View style={[styles.screen, { backgroundColor: c.bg }]}>
      <BrandHeader />
      <View style={styles.lockedBlock}>
        <View
          style={[
            styles.lockedIcon,
            { backgroundColor: c.bgWarm, borderColor: c.goldDecorative },
          ]}>
          <SymbolView
            name="lock.fill"
            size={32}
            tintColor={c.gold}
            weight="semibold"
          />
        </View>
        <Text style={[styles.lockedEyebrow, { color: c.gold }]}>
          — SALON VIP
        </Text>
        <Text style={[styles.lockedTitle, { color: c.text }]}>
          Réservé aux VIP.
        </Text>
        <Text style={[styles.lockedBody, { color: c.textMuted }]}>
          Le salon VIP réunit les abonnés VIP et notre analyste Julien.
          Échanges directs, partage de pronos, coaching privé sur demande.
          50 places maximum.
        </Text>
        <BrandedButton label="Voir le pack VIP" onPress={onUpgrade} />
      </View>
    </View>
  );
}

function CoachingPlaceholderModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const c = useThemeColors();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            { backgroundColor: c.bgElevated, borderColor: c.borderSoft },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.modalEyebrow, { color: c.gold }]}>
            — COACHING PRIVÉ
          </Text>
          <Text style={[styles.modalTitle, { color: c.text }]}>
            Fonctionnalité bientôt disponible.
          </Text>
          <Text style={[styles.modalBody, { color: c.textMuted }]}>
            Tu pourras ouvrir un fil privé avec Julien pour un coaching
            dédié à ton profil de joueur. En attendant, tu peux lui poser
            des questions dans le salon — il y répond personnellement.
          </Text>
          <BrandedButton label="Compris" onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  if (sameDay) return `${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mo} ${hh}:${mm}`;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Remonte l'image pour que le logo AJ (situé en bas) remonte vers
    // la zone visible centrale du chat.
    transform: [{ translateY: -180 }],
  },
  bgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Overlay sombre fort pour lisibilité des bulles de chat.
    backgroundColor: 'rgba(10,10,10,0.65)',
  },
  salonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  salonEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  salonTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: 2,
  },
  coachingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 999,
  },
  coachingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  loadingBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  emptyBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleColumn: {
    maxWidth: '85%',
    gap: 2,
  },
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    gap: 2,
  },
  senderName: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 19,
  },
  bubbleTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  replyQuote: {
    borderLeftWidth: 3,
    paddingLeft: 8,
    paddingVertical: 4,
    paddingRight: 8,
    borderRadius: 4,
    marginBottom: 4,
    gap: 2,
  },
  replyQuoteSender: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  replyQuoteText: {
    fontSize: 12,
    lineHeight: 16,
  },
  reactionsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
    paddingHorizontal: 6,
  },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  reactionEmoji: {
    fontSize: 13,
  },
  reactionCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  readCount: {
    fontSize: 10,
    fontWeight: '600',
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  lockedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: Spacing.two,
  },
  lockedEyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
  },
  lockedTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  lockedBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  pseudoHint: {
    padding: Spacing.two,
    margin: Spacing.three,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  pseudoHintText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 20,
  },
});
