"use client";

import { type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/config/routes";
import { DashboardShell } from "./dashboard-shell";

type AppRouteShellProps = {
  children: ReactNode;
};

export function AppRouteShell({ children }: AppRouteShellProps) {
  const pathname = usePathname();

  const isStandalonePage = useMemo(() => {
    return (
      pathname === routes.login ||
      pathname === routes.signup ||
      pathname === routes.twoFaBootstrapSetup ||
      pathname === routes.portal ||
      pathname?.startsWith(`${routes.portal}/`)
    );
  }, [pathname]);

  // Standalone pages (auth + client portal) render without the accountant
  // dashboard shell — no sidebar, no topbar, just the page content.
  if (isStandalonePage) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
