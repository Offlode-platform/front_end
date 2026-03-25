"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";
import { AuthGuard } from "@/features/auth/components/auth-guard";

export default function StaffHomePage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);

  const expiresInText = useMemo(() => {
    if (!expiresAt) return null;
    const seconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const mins = Math.floor(seconds / 60);
    return `${mins}m remaining`;
  }, [expiresAt]);

  return (
    <AuthGuard>
      <div style={{ minHeight: "100vh", padding: 24 }}>
        <div
          style={{
            maxWidth: 820,
            margin: "0 auto",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--synapse-border-subtle)",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "var(--synapse-fg-heading)",
              }}
            >
              Staff Workspace
            </h1>
            <span
              style={{
                marginLeft: "auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "rgba(232, 240, 242, 0.8)",
                fontSize: 12,
              }}
            >
              {expiresInText ? `Session: ${expiresInText}` : null}
            </span>
          </div>

          <div style={{ marginTop: 14, color: "var(--synapse-fg)" }}>
            Auth token is stored in Zustand + persisted to `localStorage`.
            Your `authenticatedApi` axios client automatically sends:
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--font-synapse-mono), ui-monospace, monospace",
                fontSize: 12,
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid var(--synapse-border-subtle)",
                background: "rgba(255,255,255,0.03)",
                wordBreak: "break-all",
              }}
            >
              Authorization: Bearer {accessToken ? `${accessToken.slice(0, 12)}…` : "—"}
            </div>
          </div>

          <button
            type="button"
            style={{
              marginTop: 18,
              width: 220,
              height: 44,
              display: "flex",
              gap: 10,
              justifyContent: "center",
              alignItems: "center",
              borderRadius: 6,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              background: "#0D9488",
              color: "#fff",
              opacity: loading ? 0.7 : 1,
            }}
            onClick={async () => {
              setLoading(true);
              try {
                await logout();
              } catch (err) {
                // Even if logout API fails, we still clear local session via store.
                void err;
              } finally {
                setLoading(false);
                router.replace(routes.login);
              }
            }}
            disabled={loading}
          >
            <LogOut size={18} />
            {loading ? "Logging out…" : "Logout"}
          </button>
        </div>
      </div>
    </AuthGuard>
  );
}

