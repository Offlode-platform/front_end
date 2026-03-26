"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users } from "lucide-react";
import { routes } from "@/config/routes";

const items = [
  { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: routes.staffHome, label: "Staff", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="offlode-shell__sidebar" aria-label="Main navigation">
      <nav className="offlode-shell__nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`offlode-shell__link ${active ? "offlode-shell__link--active" : ""}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
