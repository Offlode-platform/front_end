import axios, { type AxiosError } from "axios";
import type { FastAPIValidationErrorBody } from "@/types/auth";

function isFastApiValidationBody(
  body: unknown
): body is FastAPIValidationErrorBody {
  if (body === null || typeof body !== "object") return false;
  if (!("detail" in body)) return false;
  const detail = (body as { detail: unknown }).detail;
  return Array.isArray(detail);
}

function getDetailStringMessage(body: unknown): string | undefined {
  if (body === null || typeof body !== "object") return undefined;
  if (!("detail" in body)) return undefined;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return undefined;
}

export function getFirstValidationMessage(body: unknown): string | undefined {
  if (!isFastApiValidationBody(body)) return undefined;
  const first = body.detail[0];
  return first?.msg ?? first?.loc?.join(".");
}

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.body = body;
  }

  get isValidationError(): boolean {
    return this.status === 422 && isFastApiValidationBody(this.body);
  }

  get validationDetail(): FastAPIValidationErrorBody["detail"] | undefined {
    return isFastApiValidationBody(this.body) ? this.body.detail : undefined;
  }
}

export function parseAxiosError(error: unknown): ApiRequestError {
  if (axios.isAxiosError(error)) {
    return axiosErrorToApiRequestError(error);
  }
  if (error instanceof Error) {
    return new ApiRequestError(error.message, 0, error);
  }
  return new ApiRequestError("Unknown error", 0, error);
}

function axiosErrorToApiRequestError(error: AxiosError): ApiRequestError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data ?? null;

  let message =
    error.response?.statusText ||
    error.message ||
    "Request failed";

  if (typeof body === "string" && body.trim()) {
    message = body;
  } else {
    const detailString = getDetailStringMessage(body);
    if (detailString) {
      message = detailString;
    } else {
    const v = getFirstValidationMessage(body);
    if (v) message = v;
    }
  }

  return new ApiRequestError(message, status, body);
}
