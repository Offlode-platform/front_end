import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  CreateClientRequest,
  CreateClientResponse,
  GetClientResponse,
  ListClientsQuery,
  ListClientsResponse,
  UpdateClientRequest,
  UpdateClientResponse,
} from "@/types/clients";

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

export const clientsApi = {
  create(body: CreateClientRequest) {
    return readData<CreateClientResponse>(
      authenticatedApi.post(apiPaths.clients.base + "/", body)
    );
  },

  list(query?: ListClientsQuery) {
    return readData<ListClientsResponse>(
      authenticatedApi.get(withQuery(apiPaths.clients.base + "/", query))
    );
  },

  get(clientId: string) {
    return readData<GetClientResponse>(
      authenticatedApi.get(
        `${apiPaths.clients.base}/${encodeURIComponent(clientId)}`
      )
    );
  },

  update(clientId: string, body: UpdateClientRequest) {
    return readData<UpdateClientResponse>(
      authenticatedApi.patch(
        `${apiPaths.clients.base}/${encodeURIComponent(clientId)}`,
        body
      )
    );
  },

  delete(clientId: string) {
    return authenticatedApi.delete(
      `${apiPaths.clients.base}/${encodeURIComponent(clientId)}`
    );
  },
};

