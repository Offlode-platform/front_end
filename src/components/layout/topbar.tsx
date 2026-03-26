"use client";

import { Menu, Moon, SunMedium } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getNavItemByPath } from "./nav-config";
import { ShellBreadcrumb } from "./header/shell-breadcrumb";
import { ShellCreateMenu } from "./header/shell-create-menu";
import { ShellLogo } from "./header/shell-logo";
import { ShellNotifications } from "./header/shell-notifications";
import { ShellProfileMenu } from "./header/shell-profile-menu";
import { ShellSearch } from "./header/shell-search";

type TopbarProps = {
  onToggleSidebar: () => void;
};

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const pathname = usePathname();
  const navItem = getNavItemByPath(pathname);
  const breadcrumbText = navItem
    ? `${navItem.label}${navItem.implemented ? "" : " (Coming soon)"}`
    : "Unknown page";
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
    const nextTheme = theme === "dark" ? "light" : theme === "light" ? "hybrid" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  };

  return (
    <header className="offlode-shell__header">
      <div className="offlode-shell__header-left">
        <button
          type="button"
          className="offlode-shell__icon-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <Menu size={16} />
        </button>
        <ShellLogo />
      </div>
      <ShellBreadcrumb text={breadcrumbText[0].toUpperCase() + breadcrumbText.slice(1)} />
      <div className="offlode-shell__header-spacer" />
      <div className="offlode-shell__header-right">
        <ShellSearch />
        <button
          type="button"
          className="offlode-shell__icon-btn"
          onClick={toggleTheme}
          aria-label={`Switch theme, current ${theme}`}
          title={`Theme: ${theme}`}
        >
          {theme === "light" ? <SunMedium size={16} /> : <Moon size={16} />}
        </button>
        <ShellCreateMenu />
        <ShellNotifications />
        <ShellProfileMenu />
      </div>
    </header>
  );
}
