import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  Transaction,
  TransactionListResponse,
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
};
