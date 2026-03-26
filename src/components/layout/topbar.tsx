"use client";

import { Menu, Moon, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { ShellCreateMenu } from "./header/shell-create-menu";
import { ShellLogo } from "./header/shell-logo";
import { ShellNotifications } from "./header/shell-notifications";
import { ShellProfileMenu } from "./header/shell-profile-menu";
import { ShellSearch } from "./header/shell-search";

type TopbarProps = {
  onToggleSidebar: () => void;
};

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const [theme, setTheme] = useState<"dark" | "hybrid" | "light">(() => {
    if (typeof window === "undefined") return "hybrid";
    const existing = document.documentElement.getAttribute("data-theme");
    return existing === "dark" || existing === "hybrid" || existing === "light"
      ? existing
      : "hybrid";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme =
      theme === "dark" ? "light" : theme === "light" ? "hybrid" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };
  const setSpecificTheme = (nextTheme: "dark" | "hybrid" | "light") => {
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="offlode-shell__header shell-header">
      <div className="offlode-shell__header-left">
        <div className="md:hidden">
          <button
            type="button"
            className="offlode-shell__icon-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation"
          >
            <Menu size={16} />
          </button>
        </div>
        <ShellLogo />
      </div>
      <div className="offlode-shell__header-spacer shell-spacer" />
      <div className="offlode-shell__header-right">
        <div className="hidden md:block">
          <ShellSearch />
        </div>
        <button
          type="button"
          className="offlode-shell__icon-btn hidden md:inline-flex"
          onClick={toggleTheme}
          aria-label={`Switch theme, current ${theme}`}
          title={`Theme: ${theme}`}
        >
          {theme === "light" ? <SunMedium size={16} /> : <Moon size={16} />}
        </button>
        <ShellCreateMenu />
        <div className="hidden md:block">
          <ShellNotifications />
        </div>
        <ShellProfileMenu
          theme={theme}
          onToggleTheme={toggleTheme}
          onSetTheme={setSpecificTheme}
        />
      </div>
    </header>
  );
}
