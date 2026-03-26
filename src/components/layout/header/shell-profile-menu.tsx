"use client";

import { Bell, LogOut, Moon, Settings, SunMedium } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";

type ShellProfileMenuProps = {
  theme: "dark" | "hybrid" | "light";
  onToggleTheme: () => void;
  onSetTheme: (theme: "dark" | "hybrid" | "light") => void;
};

export function ShellProfileMenu({ theme, onToggleTheme, onSetTheme }: ShellProfileMenuProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="shell-dropdown-wrap">
      <button type="button" className="shell-avatar" aria-label="Profile menu">
        RM
      </button>
      <div className="shell-dropdown">
        <div className="shell-dropdown-title">Richard Morrison</div>
        <button type="button" className="shell-dropdown-action md:hidden">
          <Bell size={14} />
          Notifications
        </button>
        <button type="button" className="shell-dropdown-action md:hidden" onClick={onToggleTheme}>
          {theme === "light" ? <SunMedium size={14} /> : <Moon size={14} />}
          Theme: {theme}
        </button>
        <button type="button" className="shell-dropdown-action">
          <Settings size={14} />
          Settings
        </button>
        <div className="hidden md:block">
          <div className="shell-create-hint" style={{ padding: "8px 8px 4px" }}>
            Theme
          </div>
          <div style={{ display: "flex", gap: 6, padding: "0 8px 8px" }}>
            <button type="button" className="shell-dropdown-action" onClick={() => onSetTheme("dark")}>
              Dark
            </button>
            <button
              type="button"
              className="shell-dropdown-action"
              onClick={() => onSetTheme("hybrid")}
            >
              Hybrid
            </button>
            <button type="button" className="shell-dropdown-action" onClick={() => onSetTheme("light")}>
              Light
            </button>
          </div>
        </div>
        <button
          type="button"
          className="shell-dropdown-action shell-dropdown-action--danger"
          onClick={async () => {
            await logout();
            router.replace(routes.login);
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </div>
  );
}
