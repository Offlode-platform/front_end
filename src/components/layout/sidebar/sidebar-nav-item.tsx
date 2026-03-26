import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type SidebarNavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

export function SidebarNavItem({ href, label, icon: Icon, active }: SidebarNavItemProps) {
  return (
    <Link
      href={href}
      className={`offlode-shell__link nav-item ${active ? "offlode-shell__link--active active" : ""}`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </Link>
  );
}
