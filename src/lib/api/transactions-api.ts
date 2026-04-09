import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  Transaction,
  TransactionListResponse,
  TransactionUpdate,
} from "@/types/transactions";

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

export const transactionsApi = {
  missing(clientId: string) {
    return readData<TransactionListResponse>(
      authenticatedApi.get(
        `${apiPaths.transactions.base}/${encodeURIComponent(clientId)}/missing`,
      ),
    );
  },

  list(clientId: string, params?: { skip?: number; limit?: number }) {
    return readData<Transaction[]>(
      authenticatedApi.get(
        withQuery(
          `${apiPaths.transactions.base}/${encodeURIComponent(clientId)}/list`,
          params,
        ),
      ),
    );
  },

  get(transactionId: string) {
    return readData<Transaction>(
      authenticatedApi.get(
        `${apiPaths.transactions.base}/${encodeURIComponent(transactionId)}`,
      ),
    );
  },

  update(transactionId: string, body: TransactionUpdate) {
    return readData<Transaction>(
      authenticatedApi.patch(
        `${apiPaths.transactions.base}/${encodeURIComponent(transactionId)}`,
        body,
      ),
    );
  },

  detectMissing() {
    return readData<{ status: string; message: string }>(
      authenticatedApi.post(`${apiPaths.transactions.base}/detect-missing`),
    );
  },

  manualUpload(file: File, clientId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (clientId) formData.append("client_id", clientId);
    return readData<{ created: number }>(
      authenticatedApi.post(
        `${apiPaths.transactions.base}/manual-upload`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      ),
    );
  },

  statsSummary() {
    return readData<Record<string, unknown>>(
      authenticatedApi.get(`${apiPaths.transactions.base}/stats/summary`),
    );
  },
};
