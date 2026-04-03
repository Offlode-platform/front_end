export type Chase = {
  id: string;
  organization_id: string;
  client_id: string;
  transaction_id: string | null;
  chase_type: "email" | "sms" | "whatsapp" | "voice";
  status: string;
  message_content: string | null;
  message_template: string | null;
  is_escalation: boolean;
  magic_link_token: string | null;
  magic_link_expires_at: string | null;
  magic_link_clicked: boolean;
  magic_link_clicked_at: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  delivery_attempts: number;
  delivery_provider_id: string | null;
  delivery_error: string | null;
  scheduled_for: string | null;
  escalation_level: number;
  created_by: string | null;
  created_at: string;
  is_successful: boolean;
  is_pending: boolean;
  magic_link_is_valid: boolean;
};

export type ChaseHistoryResponse = {
  client_id: string;
  client_name: string;
  total_chases: number;
  email_sent: number;
  sms_sent: number;
  whatsapp_sent: number;
  delivery_rate: number;
  click_rate: number;
  last_chase_at: string | null;
  chases: Chase[];
};

export type ChaseManualSendRequest = {
  client_id: string;
  chase_type: "email" | "sms" | "whatsapp";
  custom_message?: string | null;
};

export type ChaseScheduleConfig = {
  client_id: string;
  frequency_days: number;
  escalation_days: number;
  enabled?: boolean;
  pause_until?: string | null;
  sms_enabled?: boolean | null;
  whatsapp_enabled?: boolean | null;
};

export type BulkChaseRequest = {
  client_ids: string[];
};

export type BulkChaseResponse = {
  job_ids: string[];
  scheduled_count: number;
};
