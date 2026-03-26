"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";

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
    <section className="offlode-shell__panel" style={{ maxWidth: 820 }}>
      <h1 className="offlode-shell__panel-title" style={{ marginBottom: 4 }}>
        Staff Workspace
      </h1>
      <p className="offlode-shell__subtitle" style={{ marginBottom: 12 }}>
        {expiresInText ? `Session: ${expiresInText}` : "Session active"}
      </p>
      <p style={{ fontSize: 14, marginBottom: 10 }}>
        Auth token is stored in Zustand + persisted to <code>localStorage</code>.
      </p>
      <div
        style={{
          marginBottom: 16,
          fontFamily: "var(--font-synapse-mono), ui-monospace, monospace",
          fontSize: 12,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.03)",
          wordBreak: "break-all",
        }}
      >
        Authorization: Bearer {accessToken ? `${accessToken.slice(0, 12)}...` : "-"}
      </div>
      <button
        type="button"
        className="offlode-shell__icon-btn"
        style={{ width: 200, height: 38, gap: 8 }}
        onClick={async () => {
          setLoading(true);
          try {
            await logout();
          } finally {
            setLoading(false);
            router.replace(routes.login);
          }
        }}
        disabled={loading}
      >
        <LogOut size={16} />
        {loading ? "Logging out..." : "Logout"}
      </button>
    </section>
  );
}

