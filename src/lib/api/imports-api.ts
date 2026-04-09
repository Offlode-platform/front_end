import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  ColumnMappingRequest,
  FieldDetectionResponse,
  ImportPreviewResponse,
  ImportSessionResponse,
  ImportSessionListResponse,
} from "@/types/imports";

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

export const importsApi = {
  upload(file: File, dataType: string = "invoices") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("data_type", dataType);
    return readData<FieldDetectionResponse>(
      authenticatedApi.post(`${apiPaths.imports.base}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    );
  },

  setMapping(sessionId: string, body: ColumnMappingRequest) {
    return readData<ImportSessionResponse>(
      authenticatedApi.post(
        `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}/mapping`,
        body,
      ),
    );
  },

  validate(sessionId: string) {
    return readData<ImportPreviewResponse>(
      authenticatedApi.post(
        `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}/validate`,
      ),
    );
  },

  preview(sessionId: string) {
    return readData<ImportPreviewResponse>(
      authenticatedApi.get(
        `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}/preview`,
      ),
    );
  },

  confirm(sessionId: string) {
    return readData<ImportSessionResponse>(
      authenticatedApi.post(
        `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}/confirm`,
      ),
    );
  },

  getStatus(sessionId: string) {
    return readData<ImportSessionResponse>(
      authenticatedApi.get(
        `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}`,
      ),
    );
  },

  list(params?: { limit?: number; offset?: number }) {
    return readData<ImportSessionListResponse>(
      authenticatedApi.get(
        withQuery(`${apiPaths.imports.base}/`, {
          limit: params?.limit,
          offset: params?.offset,
        }),
      ),
    );
  },

  delete(sessionId: string) {
    return authenticatedApi.delete(
      `${apiPaths.imports.base}/${encodeURIComponent(sessionId)}`,
    );
  },

  syncFromXero(dataType: string = "invoices") {
    return readData<ImportSessionResponse>(
      authenticatedApi.post(
        withQuery(`${apiPaths.imports.base}/xero/sync`, {
          data_type: dataType,
        }),
      ),
    );
  },
};
