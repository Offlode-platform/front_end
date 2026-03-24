import { AUTH_STORAGE_KEY } from "@/constants/auth-storage";

type PersistShape = {
  state?: {
    accessToken?: string | null;
  };
};

export function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistShape;
    const token = parsed.state?.accessToken;
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}
