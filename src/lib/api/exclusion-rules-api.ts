import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  ExclusionRuleCreate,
  ExclusionRuleUpdate,
  ExclusionRuleResponse,
  ExclusionRuleListResponse,
  BulkExclusionRuleCreate,
} from "@/types/exclusion-rules";

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

export const exclusionRulesApi = {
  create(body: ExclusionRuleCreate) {
    return readData<ExclusionRuleResponse>(
      authenticatedApi.post(`${apiPaths.exclusionRules.base}/`, body),
    );
  },

  list(
    organizationId: string,
    params?: { enabled_only?: boolean; skip?: number; limit?: number },
  ) {
    return readData<ExclusionRuleListResponse>(
      authenticatedApi.get(
        withQuery(`${apiPaths.exclusionRules.base}/`, {
          organization_id: organizationId,
          ...params,
        }),
      ),
    );
  },

  get(ruleId: string) {
    return readData<ExclusionRuleResponse>(
      authenticatedApi.get(
        `${apiPaths.exclusionRules.base}/${encodeURIComponent(ruleId)}`,
      ),
    );
  },

  update(ruleId: string, body: ExclusionRuleUpdate) {
    return readData<ExclusionRuleResponse>(
      authenticatedApi.patch(
        `${apiPaths.exclusionRules.base}/${encodeURIComponent(ruleId)}`,
        body,
      ),
    );
  },

  delete(ruleId: string) {
    return authenticatedApi.delete(
      `${apiPaths.exclusionRules.base}/${encodeURIComponent(ruleId)}`,
    );
  },

  bulkCreate(body: BulkExclusionRuleCreate) {
    return readData<{ created: number; rules: ExclusionRuleResponse[] }>(
      authenticatedApi.post(apiPaths.exclusionRules.bulkCreate, body),
    );
  },

  initCommonUkRules(organizationId: string) {
    return readData<{ status: string; created: number; message: string }>(
      authenticatedApi.post(
        withQuery(apiPaths.exclusionRules.initUk, {
          organization_id: organizationId,
        }),
      ),
    );
  },
};
