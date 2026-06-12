export type NotificationPreferences = {
  user_id: string;
  enabled: boolean;
  new_pronos: boolean;
  prono_results: boolean;
  vip_mentions: boolean;
  vip_new_messages: boolean;
  daily_recap: boolean;
  sport_foot: boolean;
  sport_tennis: boolean;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  updated_at: string;
};
