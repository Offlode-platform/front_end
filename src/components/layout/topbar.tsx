"use client";

import { Bell, LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";

type TopbarProps = {
  onToggleSidebar: () => void;
};

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="offlode-shell__header">
      <div className="offlode-shell__header-actions">
        <button
          type="button"
          className="offlode-shell__icon-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={16} />
        </button>
        <div className="offlode-shell__brand">Offlode</div>
      </div>
      <div className="offlode-shell__header-actions">
        <button type="button" className="offlode-shell__icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button
          type="button"
          className="offlode-shell__icon-btn"
          aria-label="Logout"
          onClick={async () => {
            await logout();
            router.replace(routes.login);
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
