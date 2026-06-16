import { publicApi } from "./public-client";
import { apiPaths } from "./endpoints";
import type {
  PortalActionResponse,
  PortalResolveResponse,
} from "@/types/portal";
import type { TransactionListResponse } from "@/types/transactions";
import type { S3PresignedUrlResponse, Document } from "@/types/documents";

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
  // Resolve a magic link token -> client info
  resolve(token: string) {
    return readData<PortalResolveResponse>(
      publicApi.get(withQuery(apiPaths.portal.resolve, { token })),
    );
  },

  // Load missing documents for a client (magic-link auth)
  missingDocs(clientId: string, token: string) {
    return readData<TransactionListResponse>(
      publicApi.post(
        withQuery(
          `/api/v1/documents/${encodeURIComponent(clientId)}/missing`,
          { token },
        ),
      ),
    );
  },

  // Request presigned S3 URL (kept for S3-enabled deployments)
  requestPresignedUrl(
    clientId: string,
    token: string,
    body: { filename: string; file_size: number; content_type: string },
  ) {
    return readData<S3PresignedUrlResponse>(
      publicApi.post(
        withQuery(
          `/api/v1/documents/${encodeURIComponent(clientId)}/request-presigned-url`,
          { token, ...body },
        ),
      ),
    );
  },

  // Finalize upload after S3 upload completes
  completeUpload(
    clientId: string,
    token: string,
    body: {
      s3_key: string;
      original_filename: string;
      file_size: number;
      transaction_id?: string;
      mime_type?: string;
    },
  ) {
    return readData<Document>(
      publicApi.post(
        withQuery(
          `/api/v1/documents/${encodeURIComponent(clientId)}/complete-upload`,
          { token, ...body },
        ),
      ),
    );
  },

  // Direct multipart upload — bypasses S3 entirely. Works in local-dev and
  // on-prem deployments without AWS credentials. This is the default path
  // the portal uses.
  directUpload(
    clientId: string,
    token: string,
    file: File,
    transactionId?: string,
    onProgress?: (percent: number) => void,
  ) {
    const formData = new FormData();
    formData.append("file", file);
    if (transactionId) {
      formData.append("transaction_id", transactionId);
    }
    return readData<Document>(
      publicApi.post(
        withQuery(
          `/api/v1/documents/${encodeURIComponent(clientId)}/direct-upload`,
          { token },
        ),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: onProgress
            ? (e: { loaded: number; total?: number }) => {
                if (e.total) {
                  // Cap real progress at 90% — reserve last 10% for server processing
                  onProgress(Math.min(90, Math.round((e.loaded / e.total) * 90)));
                }
              }
            : undefined,
        },
      ),
    );
  },

  // Poll a document until OCR is done or max attempts exhausted.
  // Passes the magic-link token so the backend accepts portal auth.
  async pollDocumentOcr(
    documentId: string,
    token: string,
    maxAttempts = 10,
    intervalMs = 3000,
  ): Promise<Document | null> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, intervalMs));
      try {
        const res = await readData<Document>(
          publicApi.get(
            withQuery(`/api/v1/documents/${encodeURIComponent(documentId)}`, { token }),
          ),
        );
        if (res.ocr_status === "completed" || res.ocr_status === "failed") {
          return res;
        }
      } catch {
        // transient error — keep polling
      }
    }
    return null;
  },

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
