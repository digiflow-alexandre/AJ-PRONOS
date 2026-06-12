export type VipMessageType = 'text' | 'system';

/** Snapshot d'un message cité (pour les replies) — garde la trace même si
 *  l'original est supprimé. */
export type ReplyToSnapshot = {
  sender_display_name: string | null;
  sender_role: 'user' | 'validator' | 'admin';
  content: string;
};

export type VipMessage = {
  id: string;
  sender_id: string | null;
  sender_display_name: string | null;
  sender_role: 'user' | 'validator' | 'admin';
  content: string;
  message_type: VipMessageType;
  deleted_at: string | null;
  deleted_by: string | null;
  reply_to_message_id: string | null;
  reply_to_snapshot: ReplyToSnapshot | null;
  mentioned_user_ids: string[];
  created_at: string;
  updated_at: string;
};

export type VipReaction = {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type VipMessageRead = {
  user_id: string;
  last_read_message_id: string;
  read_at: string;
};

export type VipParticipant = {
  id: string;
  display_name: string;
  role: 'user' | 'validator' | 'admin';
};
