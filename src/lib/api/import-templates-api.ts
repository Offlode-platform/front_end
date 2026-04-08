import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  ImportMappingTemplateCreate,
  ImportMappingTemplateResponse,
  ImportMappingTemplateListResponse,
} from "@/types/import-templates";

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

export const importTemplatesApi = {
  list(params?: { data_type?: string }) {
    return readData<ImportMappingTemplateListResponse>(
      authenticatedApi.get(
        withQuery(`${apiPaths.importTemplates.base}/`, {
          data_type: params?.data_type,
        }),
      ),
    );
  },

  create(body: ImportMappingTemplateCreate) {
    return readData<ImportMappingTemplateResponse>(
      authenticatedApi.post(`${apiPaths.importTemplates.base}/`, body),
    );
  },

  delete(templateId: string) {
    return authenticatedApi.delete(
      `${apiPaths.importTemplates.base}/${encodeURIComponent(templateId)}`,
    );
  },
};
