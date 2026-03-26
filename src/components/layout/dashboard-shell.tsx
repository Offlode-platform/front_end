"use client";

import { type ReactNode, useState } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import "@/styles/dashboard-shell.css";

type DashboardShellProps = {
  children: ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className={`offlode-shell ${sidebarOpen ? "offlode-shell--sidebar-open" : ""}`}>
        <div className="offlode-shell__card-bed" />
        <Topbar onToggleSidebar={() => setSidebarOpen((s) => !s)} />
        <Sidebar />
        <main className="offlode-shell__content-card">
          <div className="offlode-shell__page">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
