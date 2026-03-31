import { authenticatedApi } from "../authenticated-client";
import { apiPaths } from "../endpoints";
import type {
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  GetOrganizationResponse,
  ListOrganizationsQuery,
  ListOrganizationsResponse,
  UpdateOrganizationRequest,
  UpdateOrganizationResponse,
} from "@/types/organizations";

type QueryValue = string | number | boolean | undefined | null;

function withQuery(
  path: string,
  query?: Record<string, QueryValue>,
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

export const organizationsApi = {
  create(body: CreateOrganizationRequest) {
    return readData<CreateOrganizationResponse>(
      authenticatedApi.post(apiPaths.organizations.base + "/", body),
    );
  },

  list(query?: ListOrganizationsQuery) {
    return readData<ListOrganizationsResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.organizations.base + "/", query),
      ),
    );
  },

  get(organizationId: string) {
    return readData<GetOrganizationResponse>(
      authenticatedApi.get(
        `${apiPaths.organizations.base}/${encodeURIComponent(organizationId)}`,
      ),
    );
  },

  update(organizationId: string, body: UpdateOrganizationRequest) {
    return readData<UpdateOrganizationResponse>(
      authenticatedApi.patch(
        `${apiPaths.organizations.base}/${encodeURIComponent(organizationId)}`,
        body,
      ),
    );
  },

  delete(organizationId: string) {
    return authenticatedApi.delete(
      `${apiPaths.organizations.base}/${encodeURIComponent(organizationId)}`,
    );
  },
};

