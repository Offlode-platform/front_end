"use client";

import { PRIMARY_NAV_ITEMS } from "./nav-config";
import { SidebarNavGroup } from "./sidebar/sidebar-nav-group";
import { PanelLeft } from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
};

export function Sidebar({ isOpen }: SidebarProps) {
  const mobileStateClass = isOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full";

  return (
    <aside
      className={`shell-sidebar max-md:transition-transform max-md:duration-200 max-md:z-[60] ${mobileStateClass}`}
      aria-label="Main navigation"
    >
      <nav className="h-full nav-group">
        <SidebarNavGroup items={PRIMARY_NAV_ITEMS} />
        <div className="nav-spacer" />
        <div className="nav-group" />
        <button type="button" className="sidebar-toggle hidden md:inline-flex" title="Toggle sidebar">
          <PanelLeft size={15} />
        </button>
      </nav>
    </aside>
  );
}
