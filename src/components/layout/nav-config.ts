import {
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  Users,
  UsersRound,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { routes } from "@/config/routes";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  implemented: boolean;
};

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: routes.dashboard, label: "Dashboard", icon: LayoutDashboard, implemented: true },
  { href: routes.workspace, label: "Workspace", icon: Briefcase, implemented: false },
  { href: routes.clients, label: "Clients", icon: UsersRound, implemented: true },
  { href: routes.organizations, label: "Organizations", icon: Building2, implemented: true },
  { href: routes.team, label: "Team", icon: Users, implemented: false },
  { href: routes.schedule, label: "Schedule", icon: Calendar, implemented: false },
  { href: routes.reports, label: "Reports", icon: FileText, implemented: false },
];

export function getNavItemByPath(pathname: string): NavItem | null {
  return PRIMARY_NAV_ITEMS.find((item) => item.href === pathname) ?? null;
}
