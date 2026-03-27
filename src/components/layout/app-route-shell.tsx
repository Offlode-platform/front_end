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

  const isAuthPage = useMemo(() => {
    return (
      pathname === routes.login ||
      pathname === routes.signup ||
      pathname === routes.twoFaBootstrapSetup
    );
  }, [pathname]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
