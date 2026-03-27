import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { SidebarNavItem } from "./sidebar-nav-item";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type SidebarNavGroupProps = {
  items: Item[];
};

export function SidebarNavGroup({ items }: SidebarNavGroupProps) {
  const pathname = usePathname();

  return (
    <div className="nav-group">
      {items.map((item) => (
        <SidebarNavItem
          key={`${item.href}-${item.label}`}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={pathname === item.href}
        />
      ))}
    </div>
  );
}
