"use client";

import { Bell, LogOut, Search } from "lucide-react";

type DashboardTopbarProps = {
  onLogout: () => Promise<void> | void;
  isLoggingOut: boolean;
};

export function DashboardTopbar({
  onLogout,
  isLoggingOut,
}: DashboardTopbarProps) {
  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar__title-wrap">
        <p className="dashboard-topbar__eyebrow">Workspace</p>
        <h1 className="dashboard-topbar__title">Dashboard</h1>
      </div>

      <div className="dashboard-topbar__actions">
        <button type="button" className="dashboard-icon-btn" aria-label="Search">
          <Search size={14} />
        </button>
        <button
          type="button"
          className="dashboard-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={14} />
        </button>
        <button
          type="button"
          className="dashboard-logout-btn"
          onClick={() => void onLogout()}
          disabled={isLoggingOut}
        >
          <LogOut size={14} />
          {isLoggingOut ? "Logging out" : "Logout"}
        </button>
      </div>
    </header>
  );
}

