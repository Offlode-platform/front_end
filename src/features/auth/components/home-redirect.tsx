"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/config/routes";
import { useAuthStore, useAuthHasHydrated } from "@/stores/auth-store";

/**
 * Client-side gate for the root route `/`.
 *
 * The session token is in localStorage, so only the client can decide where a
 * visitor to `/` belongs:
 *  - a live token  → the dashboard (AuthGuard then verifies identity)
 *  - no token / expired → the login page
 *
 * Rendering nothing while we decide avoids flashing either destination.
 */
export function HomeRedirect() {
  const router = useRouter();
  const hydrated = useAuthHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);

  useEffect(() => {
    if (!hydrated) return;
    if (accessToken && !isTokenExpired()) {
      router.replace(routes.dashboard);
    } else {
      router.replace(routes.login);
    }
  }, [hydrated, accessToken, isTokenExpired, router]);

  return null;
}
