"use client";

import { PRIMARY_NAV_ITEMS } from "./nav-config";
import { SidebarNavGroup } from "./sidebar/sidebar-nav-group";
import { PanelLeft } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="offlode-shell__sidebar shell-sidebar" aria-label="Main navigation">
      <nav className="offlode-shell__nav">
        <SidebarNavGroup items={PRIMARY_NAV_ITEMS} />
        <div className="nav-spacer" />
        <div className="offlode-shell__nav-group" />
        <button type="button" className="sidebar-toggle hidden md:inline-flex" title="Toggle sidebar">
          <PanelLeft size={15} />
        </button>
      </nav>
    </aside>
  );
}
