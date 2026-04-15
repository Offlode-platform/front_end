export type Client = {
  name: string;
  email: string;
  phone: string;
  id: string;
  organization_id: string;
  xero_contact_id: string;
  xero_files_inbox_email: string;
  chase_enabled: boolean;
  chase_frequency_days: number;
  escalation_days: number;
  vat_tracking_enabled: boolean;
  vat_period_end_date: string;
  vat_period_completed_at: string;
  chase_paused_until: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type CreateClientRequest = {
  name: string;
  email?: string | null;
  phone?: string | null;
  organization_id: string;
  xero_contact_id?: string | null;
  xero_files_inbox_email?: string | null;
  chase_enabled: boolean;
  chase_frequency_days: number;
  escalation_days: number;
  vat_tracking_enabled: boolean;
  vat_period_end_date?: string | null;
  chase_paused_until?: string | null;
};

export type CreateClientResponse = Client;

export type ListClientsQuery = {
  assigned_to?: string;
  unassigned_only?: boolean;
  skip?: number;
  limit?: number;
};

export type ListedClient = Client & {
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_at?: string;
};

export type ListClientsResponse = ListedClient[];

export type GetClientResponse = Client;

export type UpdateClientRequest = {
  name?: string;
  email?: string;
  phone?: string;
  xero_files_inbox_email?: string;
  chase_enabled?: boolean;
  chase_frequency_days?: number;
  escalation_days?: number;
  vat_tracking_enabled?: boolean;
  vat_period_end_date?: string;
  chase_paused_until?: string;
};

export type UpdateClientResponse = Client;
