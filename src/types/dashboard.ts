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
  total_clients: number;
  items: MissingByClientItem[];
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

export type NeedsAttentionResponse = string | Record<string, unknown>;

export type OnTrackResponse = string | Record<string, unknown>;

export type ClientDashboardDetailsResponse = string;

export type BulkActionRequestBody = {
  client_ids: string[];
  details: Record<string, unknown>;
};

export type BulkActionResponse = string;

export type ExportClientsCsvRequestBody = string[];

export type ExportClientsCsvResponse = string;
