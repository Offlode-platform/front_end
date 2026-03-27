"use client";

import { PRIMARY_NAV_ITEMS } from "./nav-config";
import { SidebarNavGroup } from "./sidebar/sidebar-nav-group";
import { PanelLeft } from "lucide-react";

type SidebarProps = {
  isOpen: boolean;
};

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`shell-sidebar ${isOpen ? "open" : ""}`}
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
