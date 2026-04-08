import { authenticatedApi } from "./authenticated-client";
import { apiPaths } from "./endpoints";
import type {
  Document,
  DocumentListResponse,
  S3PresignedUrlResponse,
} from "@/types/documents";
import type { TransactionListResponse } from "@/types/transactions";

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

  missing(clientId: string) {
    return readData<TransactionListResponse>(
      authenticatedApi.post(
        `${apiPaths.documents.base}/${encodeURIComponent(clientId)}/missing`,
      ),
    );
  },

  requestPresignedUrl(
    clientId: string,
    body: {
      filename: string;
      file_size: number;
      content_type: string;
      token?: string;
    },
  ) {
    return readData<S3PresignedUrlResponse>(
      authenticatedApi.post(
        `${apiPaths.documents.base}/${encodeURIComponent(clientId)}/request-presigned-url`,
        body,
      ),
    );
  },

  completeUpload(
    clientId: string,
    body: {
      s3_key: string;
      original_filename: string;
      file_size: number;
      transaction_id?: string;
      mime_type?: string;
      token?: string;
    },
  ) {
    return readData<Document>(
      authenticatedApi.post(
        `${apiPaths.documents.base}/${encodeURIComponent(clientId)}/complete-upload`,
        body,
      ),
    );
  },

  get(documentId: string) {
    return readData<Document>(
      authenticatedApi.get(
        `${apiPaths.documents.base}/${encodeURIComponent(documentId)}`,
      ),
    );
  },

  markForwarded(documentId: string, xeroFileId?: string) {
    return readData<{ status: string; document_id: string }>(
      authenticatedApi.post(
        `${apiPaths.documents.base}/${encodeURIComponent(documentId)}/mark-forwarded`,
        { xero_file_id: xeroFileId },
      ),
    );
  },

  updateState(documentId: string, toState: string) {
    return readData<{ id: string; state: string }>(
      authenticatedApi.post(
        `${apiPaths.documents.base}/${encodeURIComponent(documentId)}/state`,
        { to_state: toState },
      ),
    );
  },

  delete(documentId: string) {
    return authenticatedApi.delete(
      `${apiPaths.documents.base}/${encodeURIComponent(documentId)}`,
    );
  },
};
