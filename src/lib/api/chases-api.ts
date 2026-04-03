import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  Chase,
  ChaseHistoryResponse,
  ChaseManualSendRequest,
  ChaseScheduleConfig,
} from "@/types/chases";

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

export const chasesApi = {
  history(clientId: string, params?: { skip?: number; limit?: number }) {
    return readData<ChaseHistoryResponse>(
      authenticatedApi.get(
        withQuery(
          `${apiPaths.chases.history}/${encodeURIComponent(clientId)}/history`,
          params,
        ),
      ),
    );
  },

  send(clientId: string, body: ChaseManualSendRequest) {
    return readData<Chase>(
      authenticatedApi.post(
        `${apiPaths.chases.send}/${encodeURIComponent(clientId)}/send`,
        body,
      ),
    );
  },

  configure(clientId: string, body: ChaseScheduleConfig) {
    return readData<ChaseScheduleConfig>(
      authenticatedApi.post(
        `${apiPaths.chases.configure}/${encodeURIComponent(clientId)}/configure`,
        body,
      ),
    );
  },

  pause(clientId: string, pauseUntil?: string) {
    return readData<Record<string, unknown>>(
      authenticatedApi.post(
        withQuery(
          `${apiPaths.chases.pause}/${encodeURIComponent(clientId)}/pause`,
          { pause_until: pauseUntil },
        ),
      ),
    );
  },

  resume(clientId: string) {
    return readData<Record<string, unknown>>(
      authenticatedApi.post(
        `${apiPaths.chases.resume}/${encodeURIComponent(clientId)}/resume`,
      ),
    );
  },

  get(chaseId: string) {
    return readData<Chase>(
      authenticatedApi.get(
        `${apiPaths.chases.get}/${encodeURIComponent(chaseId)}`,
      ),
    );
  },
};
