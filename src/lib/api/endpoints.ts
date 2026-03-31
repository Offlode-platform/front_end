import { env } from "@/config/env";

export const apiPaths = {
  health: "/health",
  auth: {
    login: "/api/v1/auth/login",
    signup: "/api/v1/auth/signup",
    logout: "/api/v1/auth/logout",
    twoFaBootstrapSetup: "/api/v1/auth/2fa/bootstrap/setup",
    twoFaBootstrapVerify: "/api/v1/auth/2fa/bootstrap/verify",
    twoFaSetup: "/api/v1/auth/2fa/setup",
    twoFaVerify: "/api/v1/auth/2fa/verify",
    magicLink: "/api/v1/auth/magic-link",
  },
  dashboard: {
    summary: "/api/v1/dashboard/summary",
    missingByClient: "/api/v1/dashboard/missing-by-client",
    needsAttentionV2: "/api/v1/dashboard/needs-attention-v2",
    recentChases: "/api/v1/dashboard/recent-chases",
    needsAttention: "/api/v1/dashboard/needs-attention",
    onTrack: "/api/v1/dashboard/on-track",
    clientDetails: "/api/v1/dashboard/client",
    bulkAction: "/api/v1/dashboard/bulk-action",
    exportCsv: "/api/v1/dashboard/export/csv",
  },
  clients: {
    base: "/api/v1/clients",
  },
} as const;

export function apiUrl(path: string): string {
  const base = env.publicApiUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
