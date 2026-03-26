"use client";

import {
  Calendar,
  FileText,
  Home,
  Settings,
  Users,
  UserRound,
  UsersRound,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Workspace", icon: UserRound },
  { label: "Clients", icon: Users },
  { label: "Team", icon: UsersRound },
  { label: "Schedule", icon: Calendar },
  { label: "Reports", icon: FileText },
  { label: "Settings", icon: Settings },
] as const;

export function DashboardSidebar() {
  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
      <div className="dashboard-sidebar__brand">
        <span className="dashboard-sidebar__dot" />
        <span>Offlode</span>
      </div>

      <nav className="dashboard-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              type="button"
              className={`dashboard-sidebar__item${item.active ? " is-active" : ""}`}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

