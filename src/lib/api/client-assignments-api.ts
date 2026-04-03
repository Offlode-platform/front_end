import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  ClientAssignmentCreate,
  ClientAssignmentBulk,
  ClientAssignmentResponse,
  ListClientAssignmentsQuery,
  ListClientAssignmentsResponse,
  BulkAssignResponse,
} from "@/types/client-assignments";

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

export const clientAssignmentsApi = {
  assign(body: ClientAssignmentCreate) {
    return readData<ClientAssignmentResponse>(
      authenticatedApi.post(apiPaths.clientAssignments.base + "/", body)
    );
  },

  list(query?: ListClientAssignmentsQuery) {
    return readData<ListClientAssignmentsResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.clientAssignments.base + "/", query)
      )
    );
  },

  bulkAssign(body: ClientAssignmentBulk) {
    return readData<BulkAssignResponse>(
      authenticatedApi.post(apiPaths.clientAssignments.base + "/bulk", body)
    );
  },

  async unassign(assignmentId: string) {
    await authenticatedApi.delete(
      `${apiPaths.clientAssignments.base}/${encodeURIComponent(assignmentId)}`
    );
  },
};
