"use client";

import { Bell, LogOut, Moon, Settings, SunMedium } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!wrapRef.current?.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, []);

  return (
    <div className="shell-profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className="shell-avatar"
        aria-label="Profile menu"
        onClick={() => setOpen((v) => !v)}
      >
        RM
      </button>
      <div className={`shell-profile-dropdown ${open ? "open" : ""}`}>
        <div className="shell-profile-header">
          <div className="shell-profile-name">Richard Morrison</div>
          <div className="shell-profile-firm">Thornbury Associates LLP</div>
        </div>
        <div className="shell-profile-section md:hidden">
          <button type="button" className="shell-profile-item">
            <Bell size={14} />
            Notifications
          </button>
          <button type="button" className="shell-profile-item" onClick={onToggleTheme}>
            {theme === "light" ? <SunMedium size={14} /> : <Moon size={14} />}
            Theme: {theme}
          </button>
        </div>
        <div className="shell-profile-section">
          <button type="button" className="shell-profile-item">
            <Settings size={14} />
            Settings
          </button>
        </div>
        <div className="shell-profile-section hidden md:block">
          <div className="shell-profile-theme">
            <div className="shell-profile-theme-label">Theme</div>
            <div className="shell-profile-theme-opts">
              <button
                type="button"
                className={`shell-profile-theme-btn ${theme === "dark" ? "active" : ""}`}
                onClick={() => onSetTheme("dark")}
              >
                Dark
              </button>
              <button
                type="button"
                className={`shell-profile-theme-btn ${theme === "hybrid" ? "active" : ""}`}
                onClick={() => onSetTheme("hybrid")}
              >
                Hybrid
              </button>
              <button
                type="button"
                className={`shell-profile-theme-btn ${theme === "light" ? "active" : ""}`}
                onClick={() => onSetTheme("light")}
              >
                Light
              </button>
            </div>
          </div>
        </div>
        <div className="shell-profile-section">
          <button
            type="button"
            className="shell-profile-item danger"
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
    </div>
  );
}
