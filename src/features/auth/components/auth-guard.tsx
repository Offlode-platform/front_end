"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { routes } from "@/config/routes";
import { useAuthStore, useAuthHasHydrated } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    if (!hydrated) return;
    if (!accessToken) {
      router.replace(routes.login);
      return;
    }
    if (isTokenExpired()) {
      clearSession();
      router.replace(routes.login);
    }
  }, [hydrated, accessToken, clearSession, isTokenExpired, router]);

  if (!hydrated) return null;

  return <>{children}</>;
}

