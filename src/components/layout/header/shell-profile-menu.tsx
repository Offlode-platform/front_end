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

function initialsOf(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ShellProfileMenu({ theme, onToggleTheme, onSetTheme }: ShellProfileMenuProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.currentUser);
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Load the current user once we have a token but no cached user yet.
  useEffect(() => {
    if (accessToken && !currentUser) {
      void loadCurrentUser();
    }
  }, [accessToken, currentUser, loadCurrentUser]);

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

  const displayName = currentUser?.name || "Loading…";
  const orgName = currentUser?.organization_name || currentUser?.email || "";
  const initials = initialsOf(currentUser?.name);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logout();
    } finally {
      router.replace(routes.login);
    }
  }

  function handleSettings() {
    setOpen(false);
    router.push(routes.settings);
  }

  return (
    <div className="shell-profile-wrap" ref={wrapRef}>
      <button
        type="button"
        className="shell-avatar"
        aria-label="Profile menu"
        title={displayName}
        onClick={() => setOpen((v) => !v)}
      >
        {initials}
      </button>
      <div className={`shell-profile-dropdown ${open ? "open" : ""}`}>
        <div className="shell-profile-header">
          <div className="shell-profile-name">{displayName}</div>
          <div className="shell-profile-firm">{orgName}</div>
          {currentUser?.role && (
            <div
              style={{
                fontSize: "var(--text-xs)",
                color: "var(--clr-muted)",
                marginTop: 2,
                textTransform: "capitalize",
              }}
            >
              {currentUser.role}
            </div>
          )}
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
          <button type="button" className="shell-profile-item" onClick={handleSettings}>
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
            onClick={handleSignOut}
            disabled={signingOut}
          >
            <LogOut size={14} />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
