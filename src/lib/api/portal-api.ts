import { publicApi } from "./public-client";
import { apiPaths } from "./endpoints";
import type { PortalActionResponse } from "@/types/portal";

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

export const portalApi = {
  cantProvide(
    clientId: string,
    transactionId: string,
    token: string,
    message?: string | null,
  ) {
    return readData<PortalActionResponse>(
      publicApi.post(
        withQuery(
          `${apiPaths.portal.base}/${encodeURIComponent(clientId)}/transactions/${encodeURIComponent(transactionId)}/cant-provide`,
          { token },
        ),
        { message },
      ),
    );
  },

  askQuestion(
    clientId: string,
    transactionId: string,
    token: string,
    message: string,
  ) {
    return readData<PortalActionResponse>(
      publicApi.post(
        withQuery(
          `${apiPaths.portal.base}/${encodeURIComponent(clientId)}/transactions/${encodeURIComponent(transactionId)}/question`,
          { token },
        ),
        { message },
      ),
    );
  },
};
