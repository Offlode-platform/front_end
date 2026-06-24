"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { routes } from "@/config/routes";
import {
  useAuthStore,
  useAuthHasHydrated,
} from "@/stores/auth-store";

/**
 * Gates the accountant dashboard shell.
 *
 * A valid session means more than "a token exists in localStorage":
 *  1. Zustand must have rehydrated (otherwise a refresh briefly sees no token).
 *  2. The token must be present and unexpired.
 *  3. The token must resolve to a real staff user via `GET /me`. A token that
 *     the server rejects (revoked, deleted user, deactivated) must NOT be able
 *     to render the dashboard.
 *
 * Until all three hold we render a loader — we never flash the dashboard to an
 * unauthenticated or unverified visitor.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthHasHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const isTokenExpired = useAuthStore((s) => s.isTokenExpired);
  const clearSession = useAuthStore((s) => s.clearSession);
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserStatus = useAuthStore((s) => s.currentUserStatus);

  const hasValidToken = Boolean(accessToken) && !isTokenExpired();

  // Step 1+2: bounce out anyone without a live token.
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

  // Step 3: with a live token but no resolved identity yet, confirm it via /me.
  useEffect(() => {
    if (!hydrated || !hasValidToken) return;
    if (currentUser || currentUserStatus !== "idle") return;
    void loadCurrentUser();
  }, [hydrated, hasValidToken, currentUser, currentUserStatus, loadCurrentUser]);

  // A token the server rejects is not a session — drop it and return to login.
  useEffect(() => {
    if (!hydrated || !hasValidToken) return;
    if (currentUserStatus === "error" && !currentUser) {
      clearSession();
      router.replace(routes.login);
    }
  }, [hydrated, hasValidToken, currentUserStatus, currentUser, clearSession, router]);

  // Hold rendering until we have a verified user. Anything short of that shows
  // the loader rather than leaking the dashboard.
  if (!hydrated || !hasValidToken || !currentUser) {
    return <AuthGuardLoader />;
  }

  return <>{children}</>;
}

function AuthGuardLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary, #0b0f14)",
        color: "var(--text-tertiary, rgba(255,255,255,0.6))",
      }}
    >
      <div
        aria-label="Loading"
        role="status"
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.12)",
          borderTopColor: "var(--primary-teal, #2aa198)",
          animation: "auth-guard-spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes auth-guard-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
