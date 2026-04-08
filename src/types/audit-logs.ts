export type AuditLogResponse = {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  client_id: string | null;
  module: string | null;
  access_type: string | null;
  severity: "info" | "warning" | "critical";
  timestamp: string;
  ip_address: string | null;
  details: Record<string, unknown>;
  user_email: string | null;
  user_name: string | null;
  client_name: string | null;
};

export type AuditLogFilter = {
  user_id?: string;
  action?: string;
  resource_type?: string;
  client_id?: string;
  module?: string;
  severity?: "info" | "warning" | "critical";
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
};

export type AuditActionSummary = Record<string, number>;
