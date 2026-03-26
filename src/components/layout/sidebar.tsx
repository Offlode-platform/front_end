"use client";

import { PRIMARY_NAV_ITEMS } from "./nav-config";
import { SidebarNavGroup } from "./sidebar/sidebar-nav-group";

export function Sidebar() {
  return (
    <aside className="offlode-shell__sidebar" aria-label="Main navigation">
      <nav className="offlode-shell__nav">
        <SidebarNavGroup items={PRIMARY_NAV_ITEMS} />
      </nav>
    </aside>
  );
}
