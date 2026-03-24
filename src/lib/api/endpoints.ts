import { env } from "@/config/env";

export const apiPaths = {
  health: "/health",
} as const;

export function apiUrl(path: string): string {
  const base = env.publicApiUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
