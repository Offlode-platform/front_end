export type DashboardSummaryResponse = {
  active_clients: number;
  total_missing_documents: number;
  total_documents_received: number;
  timestamp: string;
};

export type MissingByClientItem = {
  client_id: string;
  client_name: string;
  missing_count: number;
};

export type MissingByClientResponse = {
  total_clients?: number;
  items?: MissingByClientItem[];
  total?: number;
  clients?: MissingByClientItem[];
};

export type NeedsAttentionV2Client = {
  client_id: string;
  client_name: string;
  missing_count: number;
  last_chase_at: string;
};

export type NeedsAttentionV2Response = {
  clients: NeedsAttentionV2Client[];
};

export type RecentChaseEvent = {
  chase_id: string;
  client_id: string;
  client_name: string;
  chase_type: string;
  status: string;
  created_at: string;
};

export type RecentChasesResponse = {
  events: RecentChaseEvent[];
};

export type NeedsAttentionBucketsResponse = {
  non_responsive_clients: string[];
  vat_deadline_upcoming: string[];
  delivery_failures: string[];
  security_issues: string[];
  flagged_uploads: string[];
  unassigned_clients: string[];
};

export type NeedsAttentionResponse =
  | string
  | NeedsAttentionBucketsResponse
  | Record<string, unknown>;

export type OnTrackResponse = string | Record<string, unknown>;

export type ClientDashboardMissingTransaction = {
  date: string;
  amount: number;
  description: string;
};

export type ClientDashboardChaseEntry = {
  type: string;
  status: string;
  sent_at: string | null;
  delivered: boolean;
};

export type ClientDashboardUpload = {
  filename: string;
  uploaded_at: string;
  status: string;
  forwarded_to_xero: boolean;
};

export type ClientDashboardDetailsResponse = {
  client_id: string;
  client_name: string;
  email: string;
  phone: string;
  chase_enabled: boolean;
  chase_frequency_days: number;
  missing_documents: {
    total: number;
    grouped_by_supplier: Record<string, ClientDashboardMissingTransaction[]>;
  };
  pending_reconciliation: number;
  chase_history: ClientDashboardChaseEntry[];
  recent_uploads: ClientDashboardUpload[];
};

export type BulkActionRequestBody = {
  client_ids: string[];
  details: Record<string, unknown>;
};

export type BulkActionResponse = string;

export type ExportClientsCsvRequestBody = string[];

export type ExportClientsCsvResponse = string;
