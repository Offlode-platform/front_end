import {
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  LayoutDashboard,
  Upload,
  Users,
  UsersRound,
  Building2,
  ScrollText,
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
  { href: routes.workspace, label: "Workspace", icon: Briefcase, implemented: true },
  { href: routes.clients, label: "Clients", icon: UsersRound, implemented: true },
  { href: routes.organizations, label: "Organizations", icon: Building2, implemented: true },
  { href: routes.team, label: "Team", icon: Users, implemented: true },
  { href: routes.imports, label: "Import", icon: Upload, implemented: true },
  { href: routes.ledger, label: "Ledger", icon: BookOpen, implemented: true },
  { href: routes.schedule, label: "Schedule", icon: Calendar, implemented: false },
  { href: routes.reports, label: "Reports", icon: FileText, implemented: false },
  // { href: routes.auditLog, label: "Audit Log", icon: ScrollText, implemented: true },
];

export function getNavItemByPath(pathname: string): NavItem | null {
  return PRIMARY_NAV_ITEMS.find((item) => item.href === pathname) ?? null;
}
