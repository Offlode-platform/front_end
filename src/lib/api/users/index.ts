import { authenticatedApi } from "../authenticated-client";
import { apiPaths } from "../endpoints";
import type {
  CreateUserRequest,
  CreateUserResponse,
  ListUsersQuery,
  ListUsersResponse,
  GetUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeactivateUserRequest,
  DeactivateUserResponse,
  ManagerPermissionsRequest,
  ManagerPermissionsResponse,
} from "@/types/users";

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

export const usersApi = {
  create(body: CreateUserRequest) {
    return readData<CreateUserResponse>(
      authenticatedApi.post(apiPaths.users.base + "/", body)
    );
  },

  list(query?: ListUsersQuery) {
    return readData<ListUsersResponse>(
      authenticatedApi.get(
        withQuery(apiPaths.users.base + "/", query)
      )
    );
  },

  get(userId: string) {
    return readData<GetUserResponse>(
      authenticatedApi.get(
        `${apiPaths.users.base}/${encodeURIComponent(userId)}`
      )
    );
  },

  update(userId: string, body: UpdateUserRequest) {
    return readData<UpdateUserResponse>(
      authenticatedApi.patch(
        `${apiPaths.users.base}/${encodeURIComponent(userId)}`,
        body
      )
    );
  },

  deactivate(userId: string, body: DeactivateUserRequest) {
    return readData<DeactivateUserResponse>(
      authenticatedApi.post(
        `${apiPaths.users.base}/${encodeURIComponent(userId)}/deactivate`,
        body
      )
    );
  },

  setPermissions(userId: string, body: ManagerPermissionsRequest) {
    return readData<ManagerPermissionsResponse>(
      authenticatedApi.post(
        `${apiPaths.users.base}/${encodeURIComponent(userId)}/permissions`,
        body
      )
    );
  },

  getPermissions(userId: string) {
    return readData<ManagerPermissionsResponse>(
      authenticatedApi.get(
        `${apiPaths.users.base}/${encodeURIComponent(userId)}/permissions`
      )
    );
  },
};

