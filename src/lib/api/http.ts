import axios from "axios";
import { getBearerToken } from "@/lib/auth/bearer-token";
import { runUnauthorizedHandler } from "@/lib/auth/auth-handlers";
import { parseAxiosError } from "./errors";

const DEFAULT_TIMEOUT_MS = 60_000;

export function createAxiosInstance(options: { withAuth: boolean }) {
  const instance = axios.create({
    // Use same-origin relative URLs so requests can be proxied by Next rewrites.
    // This avoids browser CORS issues from direct cross-origin API calls.
    baseURL: undefined,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: DEFAULT_TIMEOUT_MS,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const parsed = parseAxiosError(error);
      if (
        options.withAuth &&
        parsed.status === 401 &&
        typeof window !== "undefined"
      ) {
        runUnauthorizedHandler();
      }
      return Promise.reject(parsed);
    }
  );

  if (options.withAuth) {
    instance.interceptors.request.use((config) => {
      const token = getBearerToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  return instance;
}
