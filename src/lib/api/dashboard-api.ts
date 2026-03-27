import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  BulkActionRequestBody,
  BulkActionResponse,
  ClientDashboardDetailsResponse,
  DashboardSummaryResponse,
  ExportClientsCsvRequestBody,
  ExportClientsCsvResponse,
  MissingByClientResponse,
  NeedsAttentionResponse,
  NeedsAttentionV2Response,
  OnTrackResponse,
  RecentChasesResponse,
} from "@/types/dashboard";

type QueryValue = string | number | boolean | undefined | null;

function withQuery(
  path: string,
  query?: Record<string, QueryValue>
): string {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

async function readData<T>(p: Promise<{ data: T }>): Promise<T> {
  const { data } = await p;
  return data;
}

export const dashboardApi = {
  summary() {
    return readData<DashboardSummaryResponse>(
      authenticatedApi.get(apiPaths.dashboard.summary)
    );
  },

  missingByClient() {
    return readData<MissingByClientResponse>(
      authenticatedApi.get(apiPaths.dashboard.missingByClient)
    );
  },

  needsAttentionV2() {
    return readData<NeedsAttentionV2Response>(
      authenticatedApi.get(apiPaths.dashboard.needsAttentionV2)
    );
  },

  recentChases(params?: { limit?: number }) {
    return readData<RecentChasesResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.dashboard.recentChases, { limit: params?.limit })
      )
    );
  },

  needsAttention() {
    return readData<NeedsAttentionResponse>(
      authenticatedApi.get(apiPaths.dashboard.needsAttention)
    );
  },

  onTrack(params?: { skip?: number; limit?: number }) {
    return readData<OnTrackResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.dashboard.onTrack, {
          skip: params?.skip,
          limit: params?.limit,
        })
      )
    );
  },

  clientDetails(clientId: string) {
    return readData<ClientDashboardDetailsResponse>(
      authenticatedApi.get(
        `${apiPaths.dashboard.clientDetails}/${encodeURIComponent(
          clientId
        )}/details`
      )
    );
  },

  bulkAction(action: string, body: BulkActionRequestBody) {
    return readData<BulkActionResponse>(
      authenticatedApi.post(
        withQuery(apiPaths.dashboard.bulkAction, { action }),
        body
      )
    );
  },

  exportCsv(body: ExportClientsCsvRequestBody) {
    return readData<ExportClientsCsvResponse>(
      authenticatedApi.get(apiPaths.dashboard.exportCsv, { data: body })
    );
  },
};
