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
} as const;

export function apiUrl(path: string): string {
  const base = env.publicApiUrl.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
