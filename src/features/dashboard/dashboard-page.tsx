"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";
import { DashboardSidebar } from "./components/dashboard-sidebar";
import { DashboardTopbar } from "./components/dashboard-topbar";

export function DashboardPage() {
  const router = useRouter();
  const expiresAt = useAuthStore((s) => s.expiresAt);
  const logout = useAuthStore((s) => s.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const sessionText = useMemo(() => {
    if (!expiresAt) return "Session unavailable";
    const seconds = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    const mins = Math.floor(seconds / 60);
    return `Session: ${mins}m remaining`;
  }, [expiresAt]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      router.replace(routes.login);
    }
  }

  return (
    <AuthGuard>
      <div className="dashboard-shell">
        <DashboardSidebar />

        <main className="dashboard-main">
          <DashboardTopbar onLogout={handleLogout} isLoggingOut={isLoggingOut} />

          <section className="dashboard-content">
            <article className="dashboard-card">
              <h2>Today Overview</h2>
              <p>
                This dashboard shell follows the Offlode layout schema with a dedicated
                sidebar, topbar, and canvas area.
              </p>
            </article>

            <article className="dashboard-card">
              <h2>Authentication State</h2>
              <p>{sessionText}</p>
            </article>
          </section>
        </main>
      </div>
    </AuthGuard>
  );
}

