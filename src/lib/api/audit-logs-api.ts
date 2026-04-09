import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  AuditLogResponse,
  AuditLogFilter,
  AuditActionSummary,
} from "@/types/audit-logs";

type QueryValue = string | number | boolean | undefined | null;

function withQuery(
  path: string,
  query?: Record<string, QueryValue>,
): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export const auditLogsApi = {
  list(filter?: AuditLogFilter) {
    return readData<AuditLogResponse[]>(
      authenticatedApi.get(
        withQuery(`${apiPaths.auditLogs.base}/`, filter),
      ),
    );
  },

  get(logId: string) {
    return readData<AuditLogResponse>(
      authenticatedApi.get(
        `${apiPaths.auditLogs.base}/${encodeURIComponent(logId)}`,
      ),
    );
  },

  criticalRecent(params?: { hours?: number; limit?: number }) {
    return readData<AuditLogResponse[]>(
      authenticatedApi.get(
        withQuery(apiPaths.auditLogs.critical, params),
      ),
    );
  },

  actionsSummary(params?: { start_date?: string; end_date?: string }) {
    return readData<AuditActionSummary>(
      authenticatedApi.get(
        withQuery(apiPaths.auditLogs.actionsSummary, params),
      ),
    );
  },
};
