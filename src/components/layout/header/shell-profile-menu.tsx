"use client";

import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { routes } from "@/config/routes";
import { useAuthStore } from "@/stores/auth-store";

export function ShellProfileMenu() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="shell-dropdown-wrap">
      <button type="button" className="shell-avatar" aria-label="Profile menu">
        RM
      </button>
      <div className="shell-dropdown">
        <div className="shell-dropdown-title">Richard Morrison</div>
        <button type="button" className="shell-dropdown-action">
          <Settings size={14} />
          Settings
        </button>
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
