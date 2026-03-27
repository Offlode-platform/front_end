"use client";

import { type ReactNode, useState } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="hull">
        <div className="card-bed" />
        <Topbar
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onRequestCloseSidebar={() => setSidebarOpen(false)}
        />
        {sidebarOpen ? (
          <button
            type="button"
            className="shell-sidebar-backdrop"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}
        <Sidebar isOpen={sidebarOpen} />
        <main className="content-card">
          <div className="h-full overflow-auto canvas-bg">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
