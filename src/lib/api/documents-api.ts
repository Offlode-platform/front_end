import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type { DocumentListResponse } from "@/types/documents";

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

export const documentsApi = {
  list(clientId: string, params?: { skip?: number; limit?: number }) {
    return readData<DocumentListResponse>(
      authenticatedApi.get(
        withQuery(
          `${apiPaths.documents.base}/${encodeURIComponent(clientId)}/list`,
          params,
        ),
      ),
    );
  },
};
