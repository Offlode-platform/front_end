"use client";

import { PRIMARY_NAV_ITEMS } from "./nav-config";
import { SidebarNavGroup } from "./sidebar/sidebar-nav-group";
import { LogOut, PanelLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";

type SidebarProps = {
  isOpen: boolean;
  isUtility: boolean;
  onToggleMode: () => void;
};

export function Sidebar({ isOpen, isUtility, onToggleMode }: SidebarProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      className={`shell-sidebar ${isOpen ? "open" : ""}`}
      aria-label="Main navigation"
    >
      <nav className="h-full nav-group">
        <SidebarNavGroup items={PRIMARY_NAV_ITEMS} />
        <div className="nav-spacer" />
        <div className="nav-group">
          <button
            type="button"
            className="nav-item"
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await logout();
              router.replace(routes.login);
            }}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </button>
        </div>
        {/* Only show sidebar toggle on medium screens and up (not mobile) */}
        <button
          type="button"
          className="sidebar-toggle hidden md:inline-flex"
          title={isUtility ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isUtility ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleMode}
        >
          <PanelLeft size={15} />
        </button>
      </nav>
    </aside>
  );
}
